import { NextRequest, NextResponse } from "next/server";
import { formatMailerError } from "@/lib/auth-error";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const ResendSchema = z.object({
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
        const parsed = ResendSchema.safeParse(body);
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

        const { error } = await supabase.auth.resend({
            type: "signup",
            email,
            options: {
                emailRedirectTo: origin,
            },
        });

        if (error) {
            return NextResponse.json(
                { error: formatMailerError(error) },
                { status: 400 },
            );
        }

        return NextResponse.json({
            message: "Confirmation email sent. Please check your inbox.",
        });
    } catch (error: any) {
        console.error("[api-auth-resend-confirmation] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
