import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    let lineUserId: string | null = null;
    let standaloneMemberId: string | null = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json(
                { error: "Invalid LINE ID token" },
                { status: 401 },
            );
        }
        lineUserId = lineClaims.lineUserId;
    } else if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        standaloneMemberId = parseSessionCookie(request);
        if (!standaloneMemberId) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }
    } else {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    try {
        // Delete member and associated attendances to allow re-registration during testing
        await prisma.member.delete({
            where: lineUserId ? { lineUserId } : { id: standaloneMemberId! },
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
