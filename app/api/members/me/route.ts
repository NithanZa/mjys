import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
        }
        try {
            const member = await prisma.member.findUnique({
                where: { lineUserId: lineClaims.lineUserId },
            });
            return NextResponse.json({ member });
        } catch (error) {
            console.error("[api-members-me] Error fetching member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    }

    if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        const memberId = parseSessionCookie(request);
        if (!memberId) {
            return NextResponse.json({ member: null });
        }
        try {
            const member = await prisma.member.findUnique({ where: { id: memberId } });
            return NextResponse.json({ member });
        } catch (error) {
            console.error("[api-members-me] Error fetching standalone member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    }

    return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
    );
}
