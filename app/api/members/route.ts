import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { checkRateLimit } from "@/lib/rate-limit";
import {
    createSessionToken,
    parseSessionCookie,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_OPTIONS,
} from "@/lib/standalone-auth";
import { z } from "zod";

const RegistrationSchema = z.object({
    displayName: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/),
    dob: z.string().min(1),
    address: z.string().trim().min(5),
    tocAccepted: z.literal(true),
    password: z.string().min(6).optional(),
});

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");

    let lineUserId: string = "";
    let isStandalone = false;

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
        }
        lineUserId = lineClaims.lineUserId;
    } else if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        isStandalone = true;
    } else {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    try {
        const body = await request.json();
        const parsed = RegistrationSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.format() },
                { status: 400 },
            );
        }

        const { displayName, email, phone, dob, address, tocAccepted, password } = parsed.data;

        if (isStandalone) {
            if (!password) {
                return NextResponse.json(
                    { error: "Password is required for standalone accounts." },
                    { status: 400 },
                );
            }

            const rateLimitResponse = await checkRateLimit(request, "register", email);
            if (rateLimitResponse) {
                return rateLimitResponse;
            }

            // Check if member already exists in our database with this email
            const existingMember = await prisma.member.findFirst({
                where: { email },
            });

            if (existingMember) {
                return NextResponse.json(
                    { error: "An account with this email already exists. Try signing in or resetting your password." },
                    { status: 409 },
                );
            }

            const origin =
                process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

            // Create user in Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${origin}/auth/confirm?next=/`,
                },
            });

            if (signUpError) {
                const message = /already registered|already exists/i.test(
                    signUpError.message,
                )
                    ? "An account with this email already exists. Try signing in or resetting your password."
                    : signUpError.message;
                return NextResponse.json({ error: message }, { status: 400 });
            }

            if (!signUpData.user) {
                return NextResponse.json(
                    { error: "Failed to create authentication user." },
                    { status: 500 },
                );
            }

            lineUserId = "sa_" + signUpData.user.id;

            const emailVerified = !!signUpData.user.email_confirmed_at;

            const member = await prisma.member.create({
                data: { lineUserId, displayName, email, phone, dob, address, tocAccepted },
            });

            if (!emailVerified) {
                return NextResponse.json(
                    {
                        member: null,
                        unverified: true,
                        email,
                        message: "Profile created! Please check your email to verify your account before signing in.",
                    },
                    { status: 201 },
                );
            }

            const res = NextResponse.json({ member }, { status: 201 });
            res.cookies.set(
                SESSION_COOKIE_NAME,
                createSessionToken(member.id),
                SESSION_COOKIE_OPTIONS,
            );
            return res;
        }

        const member = await prisma.member.create({
            data: { lineUserId, displayName, email, phone, dob, address, tocAccepted },
        });

        return NextResponse.json({ member }, { status: 201 });
    } catch (error: any) {
        console.error("[api-members] Error registering member:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "This account is already registered." },
                { status: 409 },
            );
        }
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
export async function PATCH(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");

    const updateSchema = z.object({
        classesAttended: z.number().int().nonnegative().optional(),
        celebratedLevels: z.array(z.enum(["CAT", "TIGER", "LEOPARD"])).optional(),
        level: z.enum(["CAT", "TIGER", "LEOPARD"]).optional(),
    });

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
        }
        try {
            const body = await request.json();
            const parsed = updateSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json(
                    { error: "Validation failed", details: parsed.error.format() },
                    { status: 400 },
                );
            }
            const member = await prisma.member.update({
                where: { lineUserId: lineClaims.lineUserId },
                data: parsed.data,
            });
            return NextResponse.json({ member });
        } catch (error) {
            console.error("[api-members] Error updating member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    }

    if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        const memberId = parseSessionCookie(request);
        if (!memberId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        try {
            const body = await request.json();
            const parsed = updateSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json(
                    { error: "Validation failed", details: parsed.error.format() },
                    { status: 400 },
                );
            }
            const member = await prisma.member.update({
                where: { id: memberId },
                data: parsed.data,
            });
            return NextResponse.json({ member });
        } catch (error) {
            console.error("[api-members] Error updating standalone member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    }

    return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
    );
}
