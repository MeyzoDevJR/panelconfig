import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { expiryFrom, isPlanId, PLANS } from "@/lib/plans";
import { createLicenseKey, getStore } from "@/lib/store";
export async function POST(request) {
    const manager = await currentUser();
    if (!manager || manager.role !== "manager") {
        return NextResponse.json({ message: "Réservé au manager." }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    const plan = String(body?.plan || "");
    const count = Math.min(20, Math.max(1, Number(body?.count || 1)));
    const email = String(body?.email || "").trim().toLowerCase();
    const note = String(body?.note || "").trim();
    if (!isPlanId(plan))
        return NextResponse.json({ message: "Durée inconnue." }, { status: 400 });
    const store = await getStore();
    let targetId = null;
    if (email) {
        const target = await store.getUserByEmail(email);
        if (!target)
            return NextResponse.json({ message: "Aucun compte avec cet email." }, { status: 404 });
        if (!target.discordId) {
            return NextResponse.json({ message: "Ce compte doit d'abord relier Discord." }, { status: 409 });
        }
        targetId = target.id;
    }
    const now = new Date();
    const keys = [];
    for (let index = 0; index < count; index += 1) {
        const key = createLicenseKey();
        keys.push(key);
        await store.createLicense({
            id: randomUUID(),
            key,
            plan,
            priceEur: PLANS[plan].price || 0,
            status: targetId ? "active" : "available",
            userId: targetId,
            createdBy: manager.id,
            createdAt: now.toISOString(),
            redeemedAt: targetId ? now.toISOString() : null,
            expiresAt: targetId ? expiryFrom(plan, now) : null,
            lockedIp: null,
            lastSeen: null,
            hostname: null,
            players: 0,
            note: note || null
        });
    }
    return NextResponse.json({ ok: true, keys });
}
