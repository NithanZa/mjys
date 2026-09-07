import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth/member-request";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const auth = await authenticateRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        // Delete member and associated attendances to allow re-registration during testing
        await prisma.member.delete({
            where:
                auth.method === "line"
                    ? { lineUserId: auth.lineUserId }
                    : { id: auth.memberId },
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
