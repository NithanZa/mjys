import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_OPTIONS,
} from "@/lib/standalone-auth";
import { z } from "zod";

const ResetPasswordSchema = z.object({
    token_hash: z.string().min(1),
    password: z.string().min(6),
});

export async function POST(request: NextRequest) {
    if (process.env.NEXT_PUBLIC_STANDALONE_MODE !== "true") {
        return NextResponse.json(
            { error: "Authentication is only available in standalone mode." },
            { status: 400 },
        );
    }

    try {
        const body = await request.json();
        const parsed = ResetPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.format() },
                { status: 400 },
            );
        }

        const { token_hash, password } = parsed.data;

        const rateLimitResponse = await checkRateLimit(request, "resetPassword");
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Verify the recovery token. This consumes it, so it can only be used once.
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash,
        });

        if (verifyError || !verifyData.user) {
            return NextResponse.json(
                { error: "This reset link is invalid or has expired. Please request a new one." },
                { status: 400 },
            );
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            verifyData.user.id,
            { password },
        );

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        const member = await prisma.member.findUnique({
            where: { lineUserId: "sa_" + verifyData.user.id },
        });

        if (!member) {
            return NextResponse.json({ member: null });
        }

        const res = NextResponse.json({ member });
        res.cookies.set(
            SESSION_COOKIE_NAME,
            createSessionToken(member.id),
            SESSION_COOKIE_OPTIONS,
        );
        return res;
    } catch (error: any) {
        console.error("[api-auth-reset-password] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
