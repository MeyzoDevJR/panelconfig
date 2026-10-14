import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { expiryFrom, isPlanId } from "@/lib/plans";
import { getStore } from "@/lib/store";
export async function POST(request) {
    const user = await currentUser();
    if (!user)
        return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
    if (!user.discordId) {
        return NextResponse.json({ message: "Relie ton Discord avant d'activer une clé." }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    const key = String(body?.key || "").trim().toUpperCase();
    const store = await getStore();
    const license = await store.getLicenseByKey(key);
    if (!license || license.status === "revoked") {
        return NextResponse.json({ message: "Clé introuvable." }, { status: 404 });
    }
    if (license.status !== "available") {
        return NextResponse.json({ message: "Cette clé est déjà utilisée." }, { status: 409 });
    }
    if (license.userId && license.userId !== user.id) {
        return NextResponse.json({ message: "Cette clé est réservée à un autre compte." }, { status: 403 });
    }
    if (!isPlanId(license.plan)) {
        return NextResponse.json({ message: "Offre inconnue." }, { status: 400 });
    }
    const now = new Date();
    await store.updateLicense(license.id, {
        status: "active",
        userId: user.id,
        redeemedAt: now.toISOString(),
        expiresAt: expiryFrom(license.plan, now)
    });
    return NextResponse.json({ ok: true });
}
