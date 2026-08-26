import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";
import { getSignedSlipUrl } from "@/lib/storage";
import { verifyAdmin } from "@/lib/admin-auth";
import { CACHE_TAGS, expireCacheTags } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/purchases
 * Fetches all PendingPurchase rows (pending, approved, or rejected).
 * Supports filtering by status: ?status=PENDING
 */
export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    try {
        const where: any = {};
        if (status) {
            where.status = status;
        }

        const purchases = await prisma.pendingPurchase.findMany({
            where,
            include: {
                member: true,
                offer: true,
                classOccurrence: { include: { instructor: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const purchasesWithSignedSlips = await Promise.all(
            purchases.map(async (p) => ({
                ...p,
                proofImageUrl: p.proofImageUrl
                    ? await getSignedSlipUrl(p.proofImageUrl)
                    : null,
            })),
        );

        return NextResponse.json({ purchases: purchasesWithSignedSlips });
    } catch (error) {
        console.error("[api-admin-purchases-get] Error loading purchases:", error);
        return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
    }
}

/**
 * POST /api/admin/purchases
 * Resolves a pending purchase slip (APPROVED or REJECTED).
 * If APPROVED: creates a member active Package.
 */
export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { purchaseId, status, rejectionReason } = body;

        if (!purchaseId || !status || !["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json(
                { error: "purchaseId and valid status ('APPROVED' | 'REJECTED') are required" },
                { status: 400 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const pending = await tx.pendingPurchase.findUnique({
                where: { id: purchaseId },
                include: { offer: true, classOccurrence: true },
            });

            if (!pending) throw new Error("PURCHASE_NOT_FOUND");
            if (pending.status !== "PENDING") throw new Error("ALREADY_REVIEWED");

            // 1. Update purchase status
            const updatedPending = await tx.pendingPurchase.update({
                where: { id: purchaseId },
                data: {
                    status: status,
                    reviewedAt: new Date(),
                    rejectionReason: status === "REJECTED" ? (rejectionReason || null) : null,
                },
                include: {
                    member: true,
                    offer: true,
                    classOccurrence: true,
                },
            });

            // 2. If approved:
            //    - PACKAGE: create member active Package record
            //    - SPECIAL_CLASS: auto-book the member into the occurrence atomically
            let memberPackage = null;
            let attendance = null;

            if (status === "APPROVED") {
                if (pending.kind === "PACKAGE") {
                    const expiresAt = addDays(new Date(), pending.offer!.validityDays);
                    memberPackage = await tx.package.create({
                        data: {
                            memberId: pending.memberId,
                            packageOfferId: pending.packageOfferId!,
                            classesRemaining: pending.offer!.classCount,
                            expiresAt: expiresAt,
                            status: "ACTIVE",
                        },
                        include: { offer: true },
                    });
                } else if (pending.kind === "SPECIAL_CLASS" && pending.classOccurrenceId) {
                    // Check if already booked (e.g. re-approval edge case)
                    const existingBooking = await tx.attendance.findFirst({
                        where: {
                            memberId: pending.memberId,
                            classOccurrenceId: pending.classOccurrenceId,
                            status: "BOOKED",
                        },
                    });

                    if (!existingBooking) {
                        // Check class is not cancelled and has space
                        const occ = await tx.classOccurrence.findUnique({
                            where: { id: pending.classOccurrenceId },
                        });

                        if (occ && !occ.isCancelled) {
                            // Increment bookedCount
                            await tx.classOccurrence.update({
                                where: { id: pending.classOccurrenceId },
                                data: { bookedCount: { increment: 1 } },
                            });

                            // Create booking record
                            attendance = await tx.attendance.create({
                                data: {
                                    memberId: pending.memberId,
                                    classOccurrenceId: pending.classOccurrenceId,
                                    status: "BOOKED",
                                },
                            });
                        }
                    }
                }
            }

            return { pending: updatedPending, package: memberPackage, booking: attendance };
        });

        expireCacheTags(
            CACHE_TAGS.memberStats,
            ...(result.booking ? [CACHE_TAGS.classes] : []),
        );
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error("[api-admin-purchases-post] Error updating purchase status:", error);
        if (error.message === "PURCHASE_NOT_FOUND") {
            return NextResponse.json({ error: "Purchase record not found." }, { status: 404 });
        }
        if (error.message === "ALREADY_REVIEWED") {
            return NextResponse.json({ error: "This purchase has already been reviewed." }, { status: 409 });
        }
        return NextResponse.json({ error: "Database transaction failed." }, { status: 500 });
    }
}
