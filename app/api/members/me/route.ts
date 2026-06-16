import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";

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

        // Return the member profile. It can be null if not registered yet.
        return NextResponse.json({ member });
    } catch (error) {
        console.error("[api-members-me] Error fetching member:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
