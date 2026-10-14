import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { getStore } from "@/lib/store";
export async function POST(request) {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email.includes("@") || password.length < 8) {
        return NextResponse.json({ message: "Email invalide ou mot de passe trop court (8 caractères)." }, { status: 400 });
    }
    const store = await getStore();
    if (await store.getUserByEmail(email)) {
        return NextResponse.json({ message: "Un compte existe déjà avec cet email." }, { status: 409 });
    }
    const user = {
        id: randomUUID(),
        email,
        passwordHash: await bcrypt.hash(password, 10),
        discordId: null,
        discordName: null,
        role: "customer",
        createdAt: new Date().toISOString()
    };
    await store.createUser(user);
    await setSessionCookie(user);
    return NextResponse.json({ ok: true });
}
