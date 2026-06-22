import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members/[id]
 * Fetch a single member's details, active packages, and full class attendance logs.
 */
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    try {
        const [member, packages, attendances, milestones] = await Promise.all([
            prisma.member.findUnique({
                where: { id },
            }),
            prisma.package.findMany({
                where: { memberId: id },
                include: { offer: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.attendance.findMany({
                where: { memberId: id },
                include: {
                    classOccurrence: {
                        include: {
                            template: true,
                            instructor: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.memberMilestone.findMany({
                where: { memberId: id },
                include: { milestone: true },
                orderBy: { unlockedAt: "desc" },
            }),
        ]);

        if (!member) {
            return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            member,
            packages,
            attendances,
            milestones,
        });
    } catch (error) {
        console.error("[api-admin-members-detail] Error loading member deep-dive:", error);
        return NextResponse.json({ error: "Failed to load member profile" }, { status: 500 });
    }
}

/**
 * POST /api/admin/members/[id]
 * Administrative action: Manually grant a Package pass directly to a member.
 * Bypass slip verification (e.g. for cash payments at counter or special overrides).
 */
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    try {
        const body = await request.json();
        const { packageOfferId } = body;

        if (!packageOfferId) {
            return NextResponse.json({ error: "packageOfferId is required" }, { status: 400 });
        }

        const [member, offer] = await Promise.all([
            prisma.member.findUnique({ where: { id } }),
            prisma.packageOffer.findUnique({ where: { id: packageOfferId } }),
        ]);

        if (!member) {
            return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
        }
        if (!offer) {
            return NextResponse.json({ error: "Package offer option not found" }, { status: 404 });
        }

        // Add a package atomically in the database
        const expiresAt = addDays(new Date(), offer.validityDays);
        const result = await prisma.$transaction(async (tx) => {
            // 1. Record simulated approved purchase log
            await tx.pendingPurchase.create({
                data: {
                    memberId: id,
                    packageOfferId,
                    status: "APPROVED",
                    reviewedAt: new Date(),
                    proofImageUrl: null, // manual cash or admin gift override
                },
            });

            // 2. Provision active package
            const pkg = await tx.package.create({
                data: {
                    memberId: id,
                    packageOfferId,
                    classesRemaining: offer.classCount,
                    expiresAt,
                    status: "ACTIVE",
                },
                include: { offer: true },
            });

            return pkg;
        });

        return NextResponse.json({ success: true, package: result });
    } catch (error) {
        console.error("[api-admin-members-grant] Error manually granting package:", error);
        return NextResponse.json({ error: "Failed to grant class package" }, { status: 500 });
    }
}
