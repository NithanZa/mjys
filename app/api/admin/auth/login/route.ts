import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const { passphrase } = await request.json();
        const securePassphrase = process.env.ADMIN_PASSPHRASE;
        const secretString = process.env.QR_SIGNING_SECRET;

        if (!securePassphrase) {
            console.error("[api-admin-login] ADMIN_PASSPHRASE is not configured in environment variables.");
            return NextResponse.json(
                { error: "Server authentication misconfigured." },
                { status: 500 },
            );
        }

        if (!secretString) {
            console.error("[api-admin-login] QR_SIGNING_SECRET is not configured in environment variables.");
            return NextResponse.json(
                { error: "Server authentication misconfigured." },
                { status: 500 },
            );
        }

        if (!passphrase || passphrase !== securePassphrase) {
            return NextResponse.json(
                { error: "Incorrect passphrase" },
                { status: 401 },
            );
        }

        // Generate session JWT with a 7-day expiration
        const secret = new TextEncoder().encode(secretString);

        const token = await new SignJWT({ role: "admin" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(secret);

        const response = NextResponse.json({ success: true });

        // Set secure HTTP-only cookie
        response.cookies.set({
            name: "mjys_admin_session",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });

        return response;
    } catch (error) {
        console.error("[api-admin-login] Error during login:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
