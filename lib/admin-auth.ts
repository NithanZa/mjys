import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "mjys_admin_session";

/** Verify the admin session cookie on a request. Returns null if valid, or a 401 NextResponse if not. */
export async function verifyAdmin(
    request: NextRequest,
): Promise<NextResponse | null> {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
    if (!cookie) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    const secretString = process.env.QR_SIGNING_SECRET;
    if (!secretString) {
        console.error("[admin-auth] QR_SIGNING_SECRET is not configured");
        return NextResponse.json(
            { error: "Server misconfigured" },
            { status: 500 },
        );
    }

    try {
        const secret = new TextEncoder().encode(secretString);
        await jwtVerify(cookie.value, secret, {
            algorithms: ["HS256"],
        });
        return null;
    } catch {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }
}
