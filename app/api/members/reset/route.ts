import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

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
        // Delete member and associated attendances to allow re-registration during testing
        await prisma.member.delete({
            where: { lineUserId: lineClaims.lineUserId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[api-members-reset] Error resetting member:", error);
        // If not found, return success anyway since we want to be unregistered
        if (error.code === "P2025") {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
