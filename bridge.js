const http = require("http");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "data", "licenses.json");
const plans = { "7j": [7, "7 jours"], "30j": [30, "30 jours"], "3m": [90, "3 mois"], "1an": [365, "1 an"], lifetime: [null, "LifeTime"] };

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(data.licenses) ? data.licenses : [];
  } catch {
    return [];
  }
}

function write(licenses) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ licenses }, null, 2));
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  });
  res.end(body);
}

function bodyOf(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")); }
      catch { resolve({}); }
    });
  });
}

function normalizeIp(ip) {
  return String(ip || "").replace(/^::ffff:/, "");
}

function remain(item) {
  const plan = plans[item.plan] || [null, item.plan];
  if (plan[0] == null) return { lifetime: true, label: "Illimite", seconds: null };
  if (!item.activated) return { lifetime: false, label: plan[0] + " jours", seconds: plan[0] * 86400 };
  const left = item.activated + plan[0] * 86400000 - Date.now();
  if (left <= 0) return { lifetime: false, label: "Expiree", seconds: 0, expired: true };
  return { lifetime: false, label: Math.ceil(left / 86400000) + " j", seconds: Math.ceil(left / 1000) };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = req.url.split("?")[0];
  if (req.method === "POST" && url === "/api/v1/sync") {
    const body = await bodyOf(req);
    const previous = new Map(read().map((item) => [String(item.key || "").toUpperCase(), item]));
    const licenses = (Array.isArray(body.licenses) ? body.licenses : []).map((item) => {
      const key = String(item.key || "").trim().toUpperCase();
      const old = previous.get(key) || {};
      return {
        key,
        plan: item.plan || "30j",
        status: item.status || "available",
        email: String(item.email || ""),
        activated: item.activated || null,
        ip: old.ip || ""
      };
    }).filter((item) => item.key.startsWith("OZONA_"));
    write(licenses);
    return send(res, 200, { ok: true });
  }
  if (req.method === "POST" && url === "/api/v1/reset-ip") {
    const body = await bodyOf(req);
    const key = String(body.key || "").trim().toUpperCase();
    write(read().map((item) => item.key === key ? { ...item, ip: "" } : item));
    return send(res, 200, { ok: true });
  }
  if (req.method === "POST" && url === "/api/v1/heartbeat") {
    const body = await bodyOf(req);
    const key = String(body.key || "").trim().toUpperCase();
    const licenses = read();
    const item = licenses.find((entry) => entry.key === key);
    if (!item || item.status === "revoked" || item.status === "available") {
      return send(res, 403, { ok: false, message: "Cle invalide ou non activee." });
    }
    const time = remain(item);
    if (time.expired) {
      item.status = "expired";
      write(licenses);
      return send(res, 403, { ok: false, message: "Licence expiree." });
    }
    const ip = normalizeIp(req.socket.remoteAddress || "");
    if (item.ip && normalizeIp(item.ip) !== ip) {
      return send(res, 403, { ok: false, message: "IP verrouillee. Reinitialise-la sur le panel." });
    }
    item.ip = item.ip || ip;
    item.hostname = String(body.hostname || "").slice(0, 80);
    write(licenses);
    const plan = plans[item.plan] || [null, item.plan];
    return send(res, 200, {
      ok: true,
      plan: item.plan,
      planLabel: plan[1],
      lifetime: time.lifetime,
      remainingSeconds: time.seconds,
      remainingLabel: time.label
    });
  }
  send(res, 404, { ok: false });
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Ozona panel local: http://127.0.0.1:3000");
});
