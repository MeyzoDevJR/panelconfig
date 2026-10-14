import { NextResponse } from "next/server";
import { readSession } from "@/lib/token";
export async function middleware(request) {
    const session = await readSession(request.cookies.get("ozona_session")?.value);
    if (!session)
        return NextResponse.redirect(new URL("/login", request.url));
    if (request.nextUrl.pathname.startsWith("/manager") && session.role !== "manager") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
}
export const config = {
    matcher: ["/dashboard", "/dashboard/:path*", "/licenses", "/licenses/:path*", "/account", "/account/:path*", "/manager", "/manager/:path*"]
};
