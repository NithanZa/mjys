import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export const config = {
    // Intercept requests to admin pages and admin API endpoints
    matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Bypass auth pages so we don't get infinite redirect loops
    if (
        pathname === "/admin/login" ||
        pathname === "/api/admin/auth/login" ||
        pathname === "/api/admin/auth/logout"
    ) {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get("mjys_admin_session");

    if (!sessionCookie) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Unauthorized access. Session expired or missing." },
                { status: 401 },
            );
        }
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
        const secretString = process.env.QR_SIGNING_SECRET;
        if (!secretString) {
            console.error("[proxy-auth] QR_SIGNING_SECRET is not configured in environment variables.");
            if (pathname.startsWith("/api/")) {
                return NextResponse.json(
                    { error: "Server authentication misconfigured." },
                    { status: 500 },
                );
            }
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        const secret = new TextEncoder().encode(secretString);

        // Verify JWT token signature and expiry
        await jwtVerify(sessionCookie.value, secret, {
            algorithms: ["HS256"],
        });

        return NextResponse.next();
    } catch (error) {
        console.error("[proxy-auth] Invalid or expired admin token:", error);
        
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Unauthorized access. Session token invalid or expired." },
                { status: 401 },
            );
        }

        // If the HTML page requests, redirect to login page after clearing invalid cookie
        const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url));
        redirectResponse.cookies.delete("mjys_admin_session");
        return redirectResponse;
    }
}
