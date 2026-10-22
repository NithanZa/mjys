import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "mjys_admin_session";

/**
 * Member QR passes are signed with the same secret, so the role claim is what
 * separates an admin session from a replayed member token.
 */
export async function isAdminSessionToken(
    token: string,
    secretString: string,
): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secretString), {
            algorithms: ["HS256"],
        });
        return payload.role === "admin";
    } catch {
        return false;
    }
}

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

    if (await isAdminSessionToken(cookie.value, secretString)) {
        return null;
    }
    return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );
}
