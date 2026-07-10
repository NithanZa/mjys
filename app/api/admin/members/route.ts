import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members
 * Fetches registered members, allowing text matching ?q=Somsak on displayName, email, or phone.
 */
export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    try {
        const where: any = {};
        if (query) {
            where.OR = [
                { displayName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
            ];
        }

        const members = await prisma.member.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error("[api-admin-members-get] Error loading members:", error);
        return NextResponse.json({ error: "Failed to load members directory" }, { status: 500 });
    }
}
