import { randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
const FILE = path.join(process.cwd(), "data", "store.json");
let chain = Promise.resolve();
function locked(fn) {
    const run = chain.then(fn, fn);
    chain = run.then(() => undefined, () => undefined);
    return run;
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export function createLicenseKey() {
    const part = (size) => randomBytes(size).toString("hex").toUpperCase();
    return `OZONA_${part(4)}_${part(2)}_${part(2)}_${part(2)}_${part(6)}`;
}
async function ensureManager(store) {
    const users = await store.listUsers();
    if (users.some((user) => user.role === "manager"))
        return;
    const email = normalizeEmail(process.env.MANAGER_EMAIL || "manager@ozona.fr");
    const password = process.env.MANAGER_PASSWORD || "OzonaManager250";
    await store.createUser({
        id: randomUUID(),
        email,
        passwordHash: await bcrypt.hash(password, 10),
        discordId: null,
        discordName: null,
        role: "manager",
        createdAt: new Date().toISOString()
    });
}
function jsonStore() {
    const read = async () => {
        try {
            const raw = await readFile(FILE, "utf8");
            const parsed = JSON.parse(raw);
            return { users: parsed.users || [], licenses: parsed.licenses || [] };
        }
        catch {
            return { users: [], licenses: [] };
        }
    };
    const write = async (data) => {
        await mkdir(path.dirname(FILE), { recursive: true });
        await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
    };
    return {
        async getUserByEmail(email) {
            const data = await read();
            return data.users.find((user) => user.email === normalizeEmail(email)) || null;
        },
        async getUserById(id) {
            const data = await read();
            return data.users.find((user) => user.id === id) || null;
        },
        async getUserByDiscord(discordId) {
            const data = await read();
            return data.users.find((user) => user.discordId === discordId) || null;
        },
        async createUser(user) {
            await locked(async () => {
                const data = await read();
                data.users.push({ ...user, email: normalizeEmail(user.email) });
                await write(data);
            });
        },
        async updateUser(id, patch) {
            await locked(async () => {
                const data = await read();
                data.users = data.users.map((user) => (user.id === id ? { ...user, ...patch, id: user.id } : user));
                await write(data);
            });
        },
        async listUsers() {
            const data = await read();
            return data.users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        },
        async createLicense(row) {
            await locked(async () => {
                const data = await read();
                data.licenses.push(row);
                await write(data);
            });
        },
        async getLicenseByKey(key) {
            const data = await read();
            return data.licenses.find((row) => row.key === key.trim().toUpperCase()) || null;
        },
        async getLicenseById(id) {
            const data = await read();
            return data.licenses.find((row) => row.id === id) || null;
        },
        async listLicenses() {
            const data = await read();
            return data.licenses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        },
        async updateLicense(id, patch) {
            await locked(async () => {
                const data = await read();
                data.licenses = data.licenses.map((row) => (row.id === id ? { ...row, ...patch, id: row.id } : row));
                await write(data);
            });
        }
    };
}
async function postgresStore(databaseUrl) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(databaseUrl, { max: 3, ssl: databaseUrl.includes("localhost") ? false : "require" });
    await sql `
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      discord_id text,
      discord_name text,
      role text NOT NULL,
      created_at timestamptz NOT NULL
    )`;
    await sql `
    CREATE TABLE IF NOT EXISTS licenses (
      id text PRIMARY KEY,
      license_key text UNIQUE NOT NULL,
      plan text NOT NULL,
      price_eur integer NOT NULL,
      status text NOT NULL,
      user_id text,
      created_by text,
      created_at timestamptz NOT NULL,
      redeemed_at timestamptz,
      expires_at timestamptz,
      locked_ip text,
      last_seen timestamptz,
      hostname text,
      players integer NOT NULL DEFAULT 0,
      note text
    )`;
    const mapUser = (row) => ({
        id: String(row.id),
        email: String(row.email),
        passwordHash: String(row.password_hash),
        discordId: row.discord_id ? String(row.discord_id) : null,
        discordName: row.discord_name ? String(row.discord_name) : null,
        role: row.role === "manager" ? "manager" : "customer",
        createdAt: new Date(String(row.created_at)).toISOString()
    });
    const mapLicense = (row) => ({
        id: String(row.id),
        key: String(row.license_key),
        plan: String(row.plan),
        priceEur: Number(row.price_eur),
        status: String(row.status),
        userId: row.user_id ? String(row.user_id) : null,
        createdBy: row.created_by ? String(row.created_by) : null,
        createdAt: new Date(String(row.created_at)).toISOString(),
        redeemedAt: row.redeemed_at ? new Date(String(row.redeemed_at)).toISOString() : null,
        expiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
        lockedIp: row.locked_ip ? String(row.locked_ip) : null,
        lastSeen: row.last_seen ? new Date(String(row.last_seen)).toISOString() : null,
        hostname: row.hostname ? String(row.hostname) : null,
        players: Number(row.players || 0),
        note: row.note ? String(row.note) : null
    });
    const saveLicense = async (row) => {
        await sql `
      INSERT INTO licenses (
        id, license_key, plan, price_eur, status, user_id, created_by, created_at,
        redeemed_at, expires_at, locked_ip, last_seen, hostname, players, note
      ) VALUES (
        ${row.id}, ${row.key}, ${row.plan}, ${row.priceEur}, ${row.status}, ${row.userId},
        ${row.createdBy}, ${row.createdAt}, ${row.redeemedAt}, ${row.expiresAt}, ${row.lockedIp},
        ${row.lastSeen}, ${row.hostname}, ${row.players}, ${row.note}
      )
      ON CONFLICT (id) DO UPDATE SET
        license_key = EXCLUDED.license_key,
        plan = EXCLUDED.plan,
        price_eur = EXCLUDED.price_eur,
        status = EXCLUDED.status,
        user_id = EXCLUDED.user_id,
        created_by = EXCLUDED.created_by,
        redeemed_at = EXCLUDED.redeemed_at,
        expires_at = EXCLUDED.expires_at,
        locked_ip = EXCLUDED.locked_ip,
        last_seen = EXCLUDED.last_seen,
        hostname = EXCLUDED.hostname,
        players = EXCLUDED.players,
        note = EXCLUDED.note`;
    };
    return {
        async getUserByEmail(email) {
            const rows = await sql `SELECT * FROM users WHERE email = ${normalizeEmail(email)} LIMIT 1`;
            return rows[0] ? mapUser(rows[0]) : null;
        },
        async getUserById(id) {
            const rows = await sql `SELECT * FROM users WHERE id = ${id} LIMIT 1`;
            return rows[0] ? mapUser(rows[0]) : null;
        },
        async getUserByDiscord(discordId) {
            const rows = await sql `SELECT * FROM users WHERE discord_id = ${discordId} LIMIT 1`;
            return rows[0] ? mapUser(rows[0]) : null;
        },
        async createUser(user) {
            await sql `
        INSERT INTO users (id, email, password_hash, discord_id, discord_name, role, created_at)
        VALUES (${user.id}, ${normalizeEmail(user.email)}, ${user.passwordHash}, ${user.discordId}, ${user.discordName}, ${user.role}, ${user.createdAt})`;
        },
        async updateUser(id, patch) {
            const found = await sql `SELECT * FROM users WHERE id = ${id} LIMIT 1`;
            const current = found[0] ? mapUser(found[0]) : null;
            if (!current)
                return;
            const next = { ...current, ...patch, id };
            await sql `
        UPDATE users SET
          email = ${normalizeEmail(next.email)},
          password_hash = ${next.passwordHash},
          discord_id = ${next.discordId},
          discord_name = ${next.discordName},
          role = ${next.role}
        WHERE id = ${id}`;
        },
        async listUsers() {
            const rows = await sql `SELECT * FROM users ORDER BY created_at DESC`;
            return rows.map((row) => mapUser(row));
        },
        async createLicense(row) {
            await saveLicense(row);
        },
        async getLicenseByKey(key) {
            const rows = await sql `SELECT * FROM licenses WHERE license_key = ${key.trim().toUpperCase()} LIMIT 1`;
            return rows[0] ? mapLicense(rows[0]) : null;
        },
        async getLicenseById(id) {
            const rows = await sql `SELECT * FROM licenses WHERE id = ${id} LIMIT 1`;
            return rows[0] ? mapLicense(rows[0]) : null;
        },
        async listLicenses() {
            const rows = await sql `SELECT * FROM licenses ORDER BY created_at DESC`;
            return rows.map((row) => mapLicense(row));
        },
        async updateLicense(id, patch) {
            const found = await sql `SELECT * FROM licenses WHERE id = ${id} LIMIT 1`;
            const current = found[0] ? mapLicense(found[0]) : null;
            if (!current)
                return;
            await saveLicense({ ...current, ...patch, id });
        }
    };
}
let storePromise = null;
export function getStore() {
    if (!storePromise) {
        storePromise = (async () => {
            const databaseUrl = process.env.DATABASE_URL;
            if (process.env.VERCEL && !databaseUrl) {
                throw new Error("DATABASE_URL est obligatoire sur Vercel. Utilise Neon ou Postgres.");
            }
            const store = databaseUrl ? await postgresStore(databaseUrl) : jsonStore();
            await ensureManager(store);
            return store;
        })();
    }
    return storePromise;
}
export function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        discordId: user.discordId,
        discordName: user.discordName,
        createdAt: user.createdAt
    };
}
