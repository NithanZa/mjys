import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";
import { encodeMemberPassSecure } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    let member: { id: string } | null = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json(
                { error: "Invalid LINE ID token" },
                { status: 401 },
            );
        }

        member = await prisma.member.findUnique({
            where: { lineUserId: lineClaims.lineUserId },
        });
    } else {
        const sessionMemberId = parseSessionCookie(request);
        if (!sessionMemberId) {
            return NextResponse.json(
                { error: "Missing or invalid authorization" },
                { status: 401 },
            );
        }

        member = await prisma.member.findUnique({
            where: { id: sessionMemberId },
        });
    }

    if (!member) {
        return NextResponse.json(
            { error: "Member not registered" },
            { status: 404 },
        );
    }

    try {
        const token = await encodeMemberPassSecure(member.id);
        return NextResponse.json({ token });
    } catch (error) {
        console.error("[api-members-qr] Error generating QR token:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
