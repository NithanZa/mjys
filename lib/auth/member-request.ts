import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isStandaloneMode } from "@/lib/auth/mode";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";
import type { Member } from "@/generated/prisma/client";

export type RequestAuth =
    | { method: "line"; lineUserId: string; displayName?: string; email?: string }
    | { method: "standalone"; memberId: string };

export type AuthFailure = { ok: false; error: string; status: number };
export type AuthSuccess = { ok: true } & RequestAuth;
export type AuthResult = AuthSuccess | AuthFailure;

function fail(error: string, status: number): AuthFailure {
    return { ok: false, error, status };
}

/**
 * Authenticate a member API request.
 *
 * LINE LIFF: requires a Bearer LINE ID token. Session cookies are ignored.
 * Standalone: requires the signed `mjys_sid` cookie.
 */
export async function authenticateRequest(
    request: NextRequest,
): Promise<AuthResult> {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        try {
            const lineClaims = await verifyLineIdToken(authHeader.substring(7));
            if (!lineClaims) {
                return fail("Invalid LINE ID token", 401);
            }
            return {
                ok: true,
                method: "line",
                lineUserId: lineClaims.lineUserId,
                displayName: lineClaims.displayName,
                email: lineClaims.email,
            };
        } catch (error) {
            console.error("[member-auth] LINE ID token verification failed:", error);
            const message =
                error instanceof Error && error.message.includes("not configured")
                    ? "LINE login is not configured on the server"
                    : "LINE ID token verification failed";
            return fail(message, 503);
        }
    }

    if (isStandaloneMode) {
        const memberId = parseSessionCookie(request);
        if (!memberId) {
            return fail("Not authenticated", 401);
        }
        return { ok: true, method: "standalone", memberId };
    }

    return fail("Missing or invalid authorization header", 401);
}

export type ResolveMemberResult =
    | { ok: true; member: Member; auth: RequestAuth }
    | AuthFailure;

/** Authenticate and load the Member row. Missing profiles are 404. */
export async function resolveAuthenticatedMember(
    request: NextRequest,
): Promise<ResolveMemberResult> {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return auth;

    try {
        const member =
            auth.method === "line"
                ? await prisma.member.findUnique({
                      where: { lineUserId: auth.lineUserId },
                  })
                : await prisma.member.findUnique({
                      where: { id: auth.memberId },
                  });
        if (!member) {
            return fail("Member not registered", 404);
        }
        return { ok: true, member, auth };
    } catch (error) {
        console.error("[member-auth] Error loading member:", error);
        return fail("Database error", 500);
    }
}
