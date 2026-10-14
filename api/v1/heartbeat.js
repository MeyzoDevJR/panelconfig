const { plans, readLicenses, writeLicenses, remain, normalizeIp, send } = require("../../lib/license-api");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { ok: false, message: "Methode refusee." });
  const body = req.body || {};
  const key = String(body.key || "").trim().toUpperCase();
  const licenses = await readLicenses();
  const item = licenses.find((entry) => entry.key === key);
  if (!item || item.status === "revoked" || item.status === "available") {
    return send(res, 403, { ok: false, message: "Cle invalide ou non activee." });
  }
  const time = remain(item);
  if (time.expired) {
    item.status = "expired";
    await writeLicenses(licenses);
    return send(res, 403, { ok: false, message: "Licence expiree." });
  }
  const ip = normalizeIp(req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : req.socket.remoteAddress);
  if (item.ip && normalizeIp(item.ip) !== ip) {
    return send(res, 403, { ok: false, message: "IP verrouillee. Reinitialise-la sur le panel." });
  }
  item.ip = item.ip || ip;
  item.hostname = String(body.hostname || "").slice(0, 80);
  await writeLicenses(licenses);
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
