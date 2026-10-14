const { readLicenses, writeLicenses, send } = require("../../lib/license-api");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { ok: false });
  const key = String((req.body || {}).key || "").trim().toUpperCase();
  const licenses = (await readLicenses()).map((item) => item.key === key ? { ...item, ip: "" } : item);
  await writeLicenses(licenses);
  return send(res, 200, { ok: true });
};
