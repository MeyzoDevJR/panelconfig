import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { getStore } from "@/lib/store";
export async function POST(request) {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const store = await getStore();
    const user = await store.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return NextResponse.json({ message: "Email ou mot de passe incorrect." }, { status: 401 });
    }
    await setSessionCookie(user);
    return NextResponse.json({ ok: true });
}
