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
            include: {
                attendances: {
                    where: { status: "CHECKED_IN" },
                    orderBy: { checkedInAt: "desc" },
                    take: 1,
                    select: { checkedInAt: true },
                },
                packages: {
                    where: {
                        expiresAt: { gte: new Date() },
                        classesRemaining: { gt: 0 },
                    },
                    select: { expiresAt: true },
                },
            },
        });

        // Enrich members with risk status
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const enrichedMembers = members.map((member) => {
            const lastCheckedIn = member.attendances[0]?.checkedInAt || null;
            const hasExpiringPackage = member.packages.some(
                (pkg) => new Date(pkg.expiresAt) <= sevenDaysFromNow && new Date(pkg.expiresAt) > now
            );

            let riskStatus: "active" | "inactive" | "expiring" = "active";
            if (lastCheckedIn && new Date(lastCheckedIn) < thirtyDaysAgo) {
                riskStatus = "inactive";
            } else if (hasExpiringPackage) {
                riskStatus = "expiring";
            }

            return {
                ...member,
                lastCheckedInAt: lastCheckedIn,
                riskStatus,
                attendances: undefined,
                packages: undefined,
            };
        });

        return NextResponse.json({ members: enrichedMembers });
    } catch (error) {
        console.error("[api-admin-members-get] Error loading members:", error);
        return NextResponse.json({ error: "Failed to load members directory" }, { status: 500 });
    }
}
