import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "mjys_line_sid";
const AUDIENCE = "mjys:line-session";
const TTL_SECONDS = 60 * 60 * 24 * 30;

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TTL_SECONDS,
} as const;

/**
 * Derived rather than the raw QR_SIGNING_SECRET so a LINE session token can
 * never verify as an admin session or a member QR pass, which use the raw secret.
 */
function signingKey(): Uint8Array {
    const secret = process.env.QR_SIGNING_SECRET;
    if (!secret) {
        throw new Error("QR_SIGNING_SECRET is not configured");
    }
    return createHash("sha256").update(`line-session:${secret}`).digest();
}

export async function createLineSessionToken(lineUserId: string): Promise<string> {
    return new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(lineUserId)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${TTL_SECONDS}s`)
        .sign(signingKey());
}

/** The LINE user ID of a valid session cookie, or null. */
export async function readLineSession(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, signingKey(), {
            algorithms: ["HS256"],
            audience: AUDIENCE,
        });
        return payload.sub ?? null;
    } catch {
        return null;
    }
}

export function setLineSessionCookie(res: NextResponse, token: string): void {
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function clearLineSessionCookie(res: NextResponse): void {
    res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0, expires: new Date(0) });
}
