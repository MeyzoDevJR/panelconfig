import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
export async function POST(request) {
    const manager = await currentUser();
    if (!manager || manager.role !== "manager") {
        return NextResponse.json({ message: "Réservé au manager." }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    const store = await getStore();
    const license = await store.getLicenseById(String(body?.id || ""));
    if (!license)
        return NextResponse.json({ message: "Clé introuvable." }, { status: 404 });
    await store.updateLicense(license.id, { status: "revoked" });
    return NextResponse.json({ ok: true });
}
