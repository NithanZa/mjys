import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { readLineSession } from "@/lib/auth/line-session";
import { isStandaloneMode } from "@/lib/auth/mode";
import { parseSessionCookie } from "@/lib/standalone-auth";
import type { Member } from "@/generated/prisma/client";

export type RequestAuth =
    | { method: "line"; lineUserId: string }
    | { method: "standalone"; memberId: string };

export type AuthFailure = { ok: false; error: string; status: number };
export type AuthSuccess = { ok: true } & RequestAuth;
export type AuthResult = AuthSuccess | AuthFailure;

function fail(error: string, status: number): AuthFailure {
    return { ok: false, error, status };
}

/**
 * Authenticate a member API request from its session cookie.
 *
 * LINE: the `mjys_line_sid` cookie issued by POST /api/auth/line-session.
 * Standalone: the signed `mjys_sid` cookie.
 */
export async function authenticateRequest(
    request: NextRequest,
): Promise<AuthResult> {
    if (isStandaloneMode) {
        const memberId = parseSessionCookie(request);
        if (!memberId) {
            return fail("Not authenticated", 401);
        }
        return { ok: true, method: "standalone", memberId };
    }

    try {
        const lineUserId = await readLineSession(request);
        if (!lineUserId) {
            return fail("Not authenticated", 401);
        }
        return { ok: true, method: "line", lineUserId };
    } catch (error) {
        console.error("[member-auth] LINE session check failed:", error);
        return fail("LINE login is not configured on the server", 503);
    }
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
