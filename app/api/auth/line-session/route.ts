import { NextRequest, NextResponse } from "next/server";
import {
    clearLineSessionCookie,
    createLineSessionToken,
    setLineSessionCookie,
} from "@/lib/auth/line-session";
import { isStandaloneMode } from "@/lib/auth/mode";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";

export const dynamic = "force-dynamic";

/**
 * Exchanges a LIFF ID token for a 30-day session cookie. LINE ID tokens expire
 * after one hour, so member APIs authenticate with the cookie instead.
 */
export async function POST(request: NextRequest) {
    if (isStandaloneMode) {
        return NextResponse.json({ error: "LINE login is disabled" }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing LINE ID token" }, { status: 401 });
    }

    try {
        const claims = await verifyLineIdToken(authHeader.substring(7));
        if (!claims) {
            const res = NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
            clearLineSessionCookie(res);
            return res;
        }

        const res = NextResponse.json(
            { ok: true },
            { headers: { "Cache-Control": "no-store" } },
        );
        setLineSessionCookie(res, await createLineSessionToken(claims.lineUserId));
        return res;
    } catch (error) {
        console.error("[api-line-session] Failed to start LINE session:", error);
        return NextResponse.json(
            { error: "LINE login is not configured on the server" },
            { status: 503 },
        );
    }
}
