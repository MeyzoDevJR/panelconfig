const encoder = new TextEncoder();
function bytesToB64url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1)
        binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function stringToB64url(value) {
    return bytesToB64url(encoder.encode(value));
}
function b64urlToString(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1)
        bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}
async function hmacKey(secret) {
    return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export function authSecret() {
    if (process.env.AUTH_SECRET)
        return process.env.AUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
        throw new Error("AUTH_SECRET manquant");
    }
    return "ozona-dev-secret-change-me";
}
export async function signSession(userId, role) {
    const header = stringToB64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = stringToB64url(JSON.stringify({
        sub: userId,
        role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14
    }));
    const data = `${header}.${payload}`;
    const key = await hmacKey(authSecret());
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
    return `${data}.${bytesToB64url(new Uint8Array(signature))}`;
}
export async function readSession(token) {
    if (!token)
        return null;
    const parts = token.split(".");
    if (parts.length !== 3)
        return null;
    const [header, payload, signature] = parts;
    const key = await hmacKey(authSecret());
    const valid = await crypto.subtle.verify("HMAC", key, Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (signature.length % 4)) % 4)), (c) => c.charCodeAt(0)), encoder.encode(`${header}.${payload}`));
    if (!valid)
        return null;
    try {
        const data = JSON.parse(b64urlToString(payload));
        if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000))
            return null;
        return data;
    }
    catch {
        return null;
    }
}
