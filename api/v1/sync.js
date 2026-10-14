const { readLicenses, writeLicenses, send } = require("../../lib/license-api");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { ok: false });
  const body = req.body || {};
  const previous = new Map((await readLicenses()).map((item) => [String(item.key || "").toUpperCase(), item]));
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
  await writeLicenses(licenses);
  return send(res, 200, { ok: true });
};
