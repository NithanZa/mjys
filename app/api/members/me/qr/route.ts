import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { encodeMemberPassSecure } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const member = await prisma.member.findUnique({
            where: { lineUserId: lineClaims.lineUserId },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Member not registered" },
                { status: 404 },
            );
        }

        // Generate HMAC-signed secure QR token (60 seconds expiry)
        const token = await encodeMemberPassSecure(member.id);
        return NextResponse.json({ token });
    } catch (error) {
        console.error("[api-members-qr] Error generating QR token:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
