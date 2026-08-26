import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseISO } from "date-fns";
import { verifyAdmin } from "@/lib/admin-auth";
import { usableLotsWhere } from "@/lib/packages/balance";
import { CACHE_TAGS, expireCacheTags } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/classes/[id]
 * Update class details (durationMin, capacity, instructorId, startsAt) OR
 * cancel the entire class (refunding all booked members).
 */
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { id } = await props.params;
    try {
        const body = await request.json();
        const { action, instructorId, capacity, durationMin, startsAt, name, description, tagline, intensity, isSpecial, specialPriceTHB } = body;

        const existing = await prisma.classOccurrence.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Class session not found." }, { status: 404 });
        }

        // Action: Cancel the class session
        if (action === "CANCEL") {
            const result = await prisma.$transaction(async (tx) => {
                const occurrence = await tx.classOccurrence.findUnique({
                    where: { id },
                });

                if (!occurrence) throw new Error("OCCURRENCE_NOT_FOUND");
                if (occurrence.isCancelled) throw new Error("ALREADY_CANCELLED");

                // Find all booked attendances
                const bookings = await tx.attendance.findMany({
                    where: {
                        classOccurrenceId: id,
                        status: "BOOKED",
                    },
                    include: {
                        consumedPackage: {
                            include: { offer: true },
                        },
                    },
                });

                // Refund each booked member (skip package refund for special classes)
                for (const booking of bookings) {
                    // Update attendance status to CANCELLED
                    await tx.attendance.update({
                        where: { id: booking.id },
                        data: { status: "CANCELLED" },
                    });

                    // Only refund package credits for normal classes
                    if (!occurrence.isSpecial) {
                        const now = new Date();
                        let creditLot = booking.consumedPackage;
                        if (!creditLot) {
                            creditLot = await tx.package.findFirst({
                                where: {
                                    memberId: booking.memberId,
                                    ...usableLotsWhere(now),
                                    offer: { type: { not: "WALK_IN" } },
                                },
                                include: { offer: true },
                                orderBy: [
                                    { expiresAt: "asc" },
                                    { createdAt: "asc" },
                                ],
                            });
                        }

                        if (
                            creditLot &&
                            creditLot.offer.type !== "WALK_IN" &&
                            creditLot.expiresAt >= now
                        ) {
                            await tx.package.update({
                                where: { id: creditLot.id },
                                data: {
                                    classesRemaining: { increment: 1 },
                                    status: "ACTIVE",
                                },
                            });
                        }
                    }
                }

                // Update bookedCount to 0
                const updated = await tx.classOccurrence.update({
                    where: { id },
                    data: {
                        bookedCount: 0,
                        isCancelled: true,
                    },
                    include: {
                        instructor: true,
                    },
                });

                return updated;
            });

            expireCacheTags(
                CACHE_TAGS.classes,
                CACHE_TAGS.memberStats,
                CACHE_TAGS.staffStats,
            );
            return NextResponse.json({ success: true, occurrence: result });
        }

        // Action: Standard update fields
        const updateData: any = {};
        if (instructorId) {
            updateData.instructorId = instructorId;
        }
        if (capacity !== undefined) {
            updateData.capacity = parseInt(capacity, 10);
        }
        if (durationMin !== undefined) {
            updateData.durationMin = parseInt(durationMin, 10);
        }
        if (startsAt) {
            updateData.startsAt = parseISO(startsAt);
        }

        if (name !== undefined) {
            updateData.name = name;
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (tagline !== undefined) {
            updateData.tagline = tagline;
        }
        if (intensity !== undefined) {
            updateData.intensity = intensity;
        }
        // Resolve the final isSpecial/specialPriceTHB state (falling back to the
        // existing row) and validate the required-price invariant authoritatively,
        // regardless of which fields the client happened to send.
        const finalIsSpecial = isSpecial !== undefined ? Boolean(isSpecial) : existing.isSpecial;

        if (finalIsSpecial) {
            const rawPrice = specialPriceTHB !== undefined ? specialPriceTHB : existing.specialPriceTHB;
            const parsedPrice = typeof rawPrice === "number" ? rawPrice : parseInt(rawPrice, 10);
            if (!rawPrice || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
                return NextResponse.json(
                    { error: "Special classes require a positive price (specialPriceTHB)" },
                    { status: 400 },
                );
            }
            updateData.isSpecial = true;
            updateData.specialPriceTHB = parsedPrice;
        } else {
            updateData.isSpecial = false;
            updateData.specialPriceTHB = null;
        }

        const updated = await prisma.classOccurrence.update({
            where: { id },
            data: updateData,
            include: {
                instructor: true,
            },
        });

        expireCacheTags(CACHE_TAGS.classes, CACHE_TAGS.staffStats);
        return NextResponse.json({ success: true, occurrence: updated });
    } catch (error: any) {
        console.error("[api-admin-classes-patch] Error updating class:", error);
        if (error.message === "OCCURRENCE_NOT_FOUND") {
            return NextResponse.json({ error: "Class session not found." }, { status: 404 });
        }
        if (error.message === "ALREADY_CANCELLED") {
            return NextResponse.json({ error: "This class has already been cancelled." }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to update class session." }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/classes/[id]
 * Delete a class occurrence completely (only allowed if bookedCount is 0).
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { id } = await props.params;
    try {
        const occurrence = await prisma.classOccurrence.findUnique({
            where: { id },
        });

        if (!occurrence) {
            return NextResponse.json({ error: "Class session not found." }, { status: 404 });
        }

        if (occurrence.bookedCount > 0) {
            return NextResponse.json(
                { error: "This class session has active bookings. Please cancel the session first to refund booked members." },
                { status: 400 },
            );
        }

        await prisma.classOccurrence.delete({
            where: { id },
        });

        expireCacheTags(
            CACHE_TAGS.classes,
            CACHE_TAGS.memberStats,
            CACHE_TAGS.staffStats,
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api-admin-classes-delete] Error deleting class:", error);
        return NextResponse.json({ error: "Failed to delete class session." }, { status: 500 });
    }
}
