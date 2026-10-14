import { NextResponse } from "next/server";
import { requestIp } from "@/lib/auth";
import { formatRemaining, PLANS, remainingSeconds } from "@/lib/plans";
import { getStore } from "@/lib/store";
export async function POST(request) {
    const body = await request.json().catch(() => null);
    const key = String(body?.key || "").trim().toUpperCase();
    if (!key.startsWith("OZONA_")) {
        return NextResponse.json({ ok: false, message: "Cle absente." }, { status: 401 });
    }
    const store = await getStore();
    const license = await store.getLicenseByKey(key);
    if (!license || license.status === "revoked" || license.status === "available") {
        return NextResponse.json({ ok: false, message: "Cle invalide ou non activee." }, { status: 403 });
    }
    const lifetime = license.plan === "lifetime";
    if (!lifetime && license.expiresAt && new Date(license.expiresAt).getTime() <= Date.now()) {
        await store.updateLicense(license.id, { status: "expired" });
        return NextResponse.json({ ok: false, message: "Licence expiree." }, { status: 403 });
    }
    const ip = requestIp(request);
    if (license.lockedIp && license.lockedIp !== ip) {
        return NextResponse.json({ ok: false, message: "IP verrouillee. Reinitialise-la sur le panel." }, { status: 403 });
    }
    const now = new Date().toISOString();
    await store.updateLicense(license.id, {
        lockedIp: license.lockedIp || ip,
        lastSeen: now,
        hostname: String(body?.hostname || "").slice(0, 80) || license.hostname,
        players: Number(body?.players || 0)
    });
    const seconds = remainingSeconds(license.expiresAt, lifetime);
    return NextResponse.json({
        ok: true,
        plan: license.plan,
        planLabel: PLANS[license.plan].long,
        lifetime,
        expiresAt: license.expiresAt,
        remainingSeconds: seconds,
        remainingLabel: formatRemaining(seconds, lifetime)
    });
}
