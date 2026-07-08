import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
    email: z.string().trim().email(),
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
        const parsed = ForgotPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.format() },
                { status: 400 },
            );
        }

        const { email } = parsed.data;

        const rateLimitResponse = await checkRateLimit(request, "email", email);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const origin =
            process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

        // Always respond with success to avoid leaking which emails are registered.
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/reset-password`,
        });

        return NextResponse.json({
            message:
                "If an account exists for that email, a password reset link has been sent.",
        });
    } catch (error: any) {
        console.error("[api-auth-forgot-password] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
