const { plans, remain, normalizeIp, send } = require("../../lib/license-api");

const PROJECT = "configbase-fb263";
const API_KEY = "AIzaSyC8P1fMXakiCKjcvB1Jw6Lvr9KKXBnxU";

function localIp(ip) {
  const value = normalizeIp(ip);
  return value === "127.0.0.1" || value === "::1" || value === "localhost";
}

function field(fields, name) {
  const value = fields[name];
  if (!value) return null;
  if (value.nullValue !== undefined) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  return null;
}

async function readLicense(key) {
  const url = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/licenses/" + encodeURIComponent(key) + "?key=" + API_KEY;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error("firestore");
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const fields = data.fields || {};
  return {
    key: field(fields, "key") || key,
    plan: field(fields, "plan") || "30j",
    status: field(fields, "status") || "available",
    email: field(fields, "email") || "",
    activated: field(fields, "activated"),
    ip: field(fields, "ip") || ""
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { ok: false, message: "Methode refusee." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const key = String(body.key || "").trim().toUpperCase();
  let item = null;
  try {
    item = await readLicense(key);
  } catch (err) {
    return send(res, 403, { ok: false, message: "Firebase inaccessible (" + err.status + "). Publie les regles Firestore." });
  }
  if (!item || item.status === "revoked" || item.status === "available") {
    return send(res, 403, { ok: false, message: "Cle invalide ou non activee." });
  }
  const time = remain(item);
  if (time.expired) {
    return send(res, 403, { ok: false, message: "Licence expiree." });
  }
  const ip = normalizeIp(req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : req.socket.remoteAddress);
  if (item.ip && !localIp(item.ip) && normalizeIp(item.ip) !== ip) {
    return send(res, 403, { ok: false, message: "IP verrouillee. Reinitialise-la sur le panel." });
  }
  const plan = plans[item.plan] || [null, item.plan];
  return send(res, 200, {
    ok: true,
    plan: item.plan,
    planLabel: plan[1],
    lifetime: time.lifetime,
    remainingSeconds: time.seconds,
    remainingLabel: time.label
  });
};
