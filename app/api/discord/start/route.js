import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl, currentUser } from "@/lib/auth";
export async function GET() {
    const user = await currentUser();
    if (!user)
        return NextResponse.redirect(new URL("/login", appUrl()));
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId || !process.env.DISCORD_CLIENT_SECRET) {
        return NextResponse.redirect(new URL("/account?discord=erreur", appUrl()));
    }
    const state = randomUUID();
    const jar = await cookies();
    jar.set("ozona_discord_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        scope: "identify",
        state,
        redirect_uri: `${appUrl()}/api/discord/callback`,
        prompt: "consent"
    });
    return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
