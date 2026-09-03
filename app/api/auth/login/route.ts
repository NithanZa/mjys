import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatAuthError } from "@/lib/auth-error";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_OPTIONS,
} from "@/lib/standalone-auth";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().trim().email(),
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
        const parsed = LoginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.format() },
                { status: 400 },
            );
        }

        const { email, password } = parsed.data;

        const rateLimitResponse = await checkRateLimit(request, "login", email);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Authenticate with Supabase Auth using our service client
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            return NextResponse.json(
                { error: formatAuthError(signInError, "Invalid email or password.") },
                { status: 401 },
            );
        }

        if (!data.user) {
            return NextResponse.json(
                { error: "Authentication failed. User not found." },
                { status: 401 },
            );
        }

        // Verify email confirmation status
        if (!data.user.email_confirmed_at) {
            return NextResponse.json(
                {
                    error: "Please verify your email address before logging in.",
                    unverified: true,
                    email: data.user.email,
                },
                { status: 401 },
            );
        }

        // Find matching Member record
        const member = await prisma.member.findUnique({
            where: { lineUserId: "sa_" + data.user.id },
        });

        if (!member) {
            return NextResponse.json(
                {
                    error: "Your account is created, but no member profile exists.",
                    needProfileSetup: true,
                    email: data.user.email,
                },
                { status: 404 },
            );
        }

        const res = NextResponse.json({ member });
        res.cookies.set(
            SESSION_COOKIE_NAME,
            createSessionToken(member.id),
            SESSION_COOKIE_OPTIONS,
        );
        return res;
    } catch (error: any) {
        console.error("[api-auth-login] Error logging in:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
