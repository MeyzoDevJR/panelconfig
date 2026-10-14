import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl, currentUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
export async function GET(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const jar = await cookies();
    const expected = jar.get("ozona_discord_state")?.value;
    jar.delete("ozona_discord_state");
    const user = await currentUser();
    if (!user || !code || !state || state !== expected) {
        return NextResponse.redirect(new URL("/account?discord=erreur", appUrl()));
    }
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID || "",
            client_secret: process.env.DISCORD_CLIENT_SECRET || "",
            grant_type: "authorization_code",
            code,
            redirect_uri: `${appUrl()}/api/discord/callback`
        })
    });
    if (!tokenResponse.ok)
        return NextResponse.redirect(new URL("/account?discord=erreur", appUrl()));
    const token = await tokenResponse.json();
    const profileResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!profileResponse.ok)
        return NextResponse.redirect(new URL("/account?discord=erreur", appUrl()));
    const profile = await profileResponse.json();
    const store = await getStore();
    const existing = await store.getUserByDiscord(profile.id);
    if (existing && existing.id !== user.id) {
        return NextResponse.redirect(new URL("/account?discord=pris", appUrl()));
    }
    const name = profile.discriminator && profile.discriminator !== "0"
        ? `${profile.username}#${profile.discriminator}`
        : profile.username;
    await store.updateUser(user.id, { discordId: profile.id, discordName: name });
    return NextResponse.redirect(new URL("/account?discord=ok", appUrl()));
}
