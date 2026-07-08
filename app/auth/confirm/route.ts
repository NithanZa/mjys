import { NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_OPTIONS,
} from "@/lib/standalone-auth";

/**
 * Handles the confirmation link sent in the "Confirm signup" email.
 * Expects the Supabase email template to point here with a `token_hash`
 * and `type` query param (see docs/guides/supabase-password-auth.md).
 *
 * On success we mark the member's account as verified and log them in
 * immediately by issuing our own session cookie, so they never have to
 * re-enter their password after clicking the link.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    if (token_hash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });

        if (!error && data.user) {
            const res = NextResponse.redirect(new URL(next, origin));

            const member = await prisma.member.findUnique({
                where: { lineUserId: "sa_" + data.user.id },
            });

            if (member) {
                res.cookies.set(
                    SESSION_COOKIE_NAME,
                    createSessionToken(member.id),
                    SESSION_COOKIE_OPTIONS,
                );
            }

            return res;
        }
    }

    return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
}
