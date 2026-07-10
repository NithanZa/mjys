/**
 * Standalone mode session utilities.
 *
 * When NEXT_PUBLIC_STANDALONE_MODE=true the app runs as a regular web app with no
 * LINE authentication. Members authenticate via a signed HttpOnly cookie issued at
 * registration. The cookie embeds the member's DB id and is verified server-side on
 * every request.
 */
import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "mjys_sid";

function sign(memberId: string): string {
    const secret = process.env.QR_SIGNING_SECRET;
    if (!secret) {
        throw new Error("QR_SIGNING_SECRET is not configured");
    }
    const hmac = createHmac("sha256", secret);
    hmac.update(memberId);
    return hmac.digest("hex").slice(0, 16);
}

/** Create a signed session token embedding the member's DB id. */
export function createSessionToken(memberId: string): string {
    return `${memberId}.${sign(memberId)}`;
}

/** Verify a session token and return the member ID, or null if tampered/missing. */
export function verifySessionToken(token: string): string | null {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;
    const memberId = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    if (sig !== sign(memberId)) return null;
    return memberId;
}

/** Extract and verify the standalone session cookie from a route-handler request. */
export function parseSessionCookie(request: NextRequest): string | null {
    const cookie = request.cookies.get(COOKIE_NAME);
    if (!cookie) return null;
    return verifySessionToken(cookie.value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
} as const;
