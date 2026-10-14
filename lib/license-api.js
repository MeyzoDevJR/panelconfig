const fs = require("fs");
const os = require("os");
const path = require("path");

const plans = { "7j": [7, "7 jours"], "30j": [30, "30 jours"], "3m": [90, "3 mois"], "1an": [365, "1 an"], lifetime: [null, "LifeTime"] };
const tmpFile = path.join(os.tmpdir(), "ozona-licenses.json");
let seed = [];
try {
  seed = require("../data/licenses.json").licenses || [];
} catch {
  seed = [];
}

function kv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

function readTmp() {
  try {
    const data = JSON.parse(fs.readFileSync(tmpFile, "utf8"));
    return Array.isArray(data.licenses) ? data.licenses : null;
  } catch {
    return null;
  }
}

function writeTmp(licenses) {
  try { fs.writeFileSync(tmpFile, JSON.stringify({ licenses })); } catch { /* disque en lecture seule */ }
}

async function readLicenses() {
  const cfg = kv();
  if (cfg) {
    const res = await fetch(cfg.url + "/get/ozona-licenses", { headers: { Authorization: "Bearer " + cfg.token } });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        try { return JSON.parse(data.result); } catch { /* valeur illisible */ }
      } else {
        await writeLicenses(seed);
        return seed;
      }
    }
  }
  return readTmp() || seed;
}

async function writeLicenses(licenses) {
  const cfg = kv();
  if (cfg) {
    await fetch(cfg.url, {
      method: "POST",
      headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
      body: JSON.stringify(["SET", "ozona-licenses", JSON.stringify(licenses)])
    });
  }
  writeTmp(licenses);
}

function remain(item) {
  const plan = plans[item.plan] || [null, item.plan];
  if (plan[0] == null) return { lifetime: true, label: "Illimite", seconds: null };
  if (!item.activated) return { lifetime: false, label: plan[0] + " jours", seconds: plan[0] * 86400 };
  const left = item.activated + plan[0] * 86400000 - Date.now();
  if (left <= 0) return { lifetime: false, label: "Expiree", seconds: 0, expired: true };
  return { lifetime: false, label: Math.ceil(left / 86400000) + " j", seconds: Math.ceil(left / 1000) };
}

function normalizeIp(ip) {
  return String(ip || "").replace(/^::ffff:/, "");
}

function send(res, status, payload) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.status(status).json(payload);
}

module.exports = { plans, readLicenses, writeLicenses, remain, normalizeIp, send };
