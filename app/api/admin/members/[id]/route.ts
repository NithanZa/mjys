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

/**
 * DELETE /api/admin/members/[id]
 * Administrative action: Either resets user activity and wipes slips, or deletes completely.
 * Query parameter: ?action=reset OR ?action=delete (defaults to delete)
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "delete";

    try {
        const member = await prisma.member.findUnique({
            where: { id },
        });

        if (!member) {
            return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
        }

        // Find all purchases that have a payment slip to delete files from Supabase Storage
        const purchasesWithSlips = await prisma.pendingPurchase.findMany({
            where: {
                memberId: id,
                proofImageUrl: { not: null },
            },
            select: { proofImageUrl: true },
        });

        // Delete slip files from Supabase Storage 'slips' bucket
        if (purchasesWithSlips.length > 0) {
            const { supabase } = await import("@/lib/supabase");
            const fileNames = purchasesWithSlips
                .map((p) => {
                    const parts = p.proofImageUrl?.split("/slips/");
                    return parts && parts.length > 1 ? parts[1] : null;
                })
                .filter((name): name is string => name !== null);

            if (fileNames.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from("slips")
                    .remove(fileNames);
                if (storageError) {
                    console.error("[api-admin-members-delete] Error deleting slips from Supabase storage:", storageError);
                }
            }
        }

        if (action === "reset") {
            // Action 1: Wipe activity logs and reset as new, keeping credentials
            await prisma.$transaction([
                prisma.attendance.deleteMany({ where: { memberId: id } }),
                prisma.pendingPurchase.deleteMany({ where: { memberId: id } }),
                prisma.package.deleteMany({ where: { memberId: id } }),
                prisma.memberToyPart.deleteMany({ where: { memberId: id } }),
                prisma.memberMilestone.deleteMany({ where: { memberId: id } }),
                prisma.member.update({
                    where: { id },
                    data: {
                        classesAttended: 0,
                        level: "CAT",
                        celebratedLevels: [],
                    },
                }),
            ]);

            return NextResponse.json({
                success: true,
                message: "Member activity and payment slips wiped successfully. Profile reset to brand new.",
            });
        } else {
            // Action 2: Delete completely (including Auth account)
            // Delete from Supabase Auth if standalone
            if (member.lineUserId.startsWith("sa_")) {
                const supabaseUserId = member.lineUserId.substring(3);
                const { supabase } = await import("@/lib/supabase");
                const { error: authError } = await supabase.auth.admin.deleteUser(supabaseUserId);
                if (authError) {
                    console.error("[api-admin-members-delete] Error deleting Supabase auth user:", authError);
                    // Continue with database deletion anyway
                }
            }

            // Delete member from database (cascades automatically to all associated tables)
            await prisma.member.delete({
                where: { id },
            });

            return NextResponse.json({
                success: true,
                message: "Member and all personal data deleted completely from system.",
            });
        }
    } catch (error) {
        console.error("[api-admin-members-delete] Error executing action:", error);
        return NextResponse.json({ error: "Failed to perform administrative action" }, { status: 500 });
    }
}
