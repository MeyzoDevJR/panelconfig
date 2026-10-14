import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { readSession, signSession } from "@/lib/token";
const COOKIE = "ozona_session";
export async function setSessionCookie(user) {
    const token = await signSession(user.id, user.role);
    const jar = await cookies();
    jar.set(COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14
    });
}
export async function clearSessionCookie() {
    const jar = await cookies();
    jar.delete(COOKIE);
}
export async function currentUser() {
    const jar = await cookies();
    const session = await readSession(jar.get(COOKIE)?.value);
    if (!session)
        return null;
    const store = await getStore();
    return store.getUserById(session.sub);
}
export async function requireUser() {
    const user = await currentUser();
    if (!user)
        redirect("/login");
    return user;
}
export async function requireManager() {
    const user = await requireUser();
    if (user.role !== "manager")
        redirect("/dashboard");
    return user;
}
export function requestIp(request) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded)
        return forwarded.split(",")[0].trim();
    return request.headers.get("x-real-ip")?.trim() || "local";
}
export function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
