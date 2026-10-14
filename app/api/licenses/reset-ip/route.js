import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
export async function POST(request) {
    const user = await currentUser();
    if (!user)
        return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
    const body = await request.json().catch(() => null);
    const store = await getStore();
    const license = await store.getLicenseById(String(body?.id || ""));
    if (!license)
        return NextResponse.json({ message: "Licence introuvable." }, { status: 404 });
    if (license.userId !== user.id && user.role !== "manager") {
        return NextResponse.json({ message: "Cette licence ne t'appartient pas." }, { status: 403 });
    }
    await store.updateLicense(license.id, { lockedIp: null });
    return NextResponse.json({ ok: true });
}
