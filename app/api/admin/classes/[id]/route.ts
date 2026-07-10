import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseISO } from "date-fns";
import { verifyAdmin } from "@/lib/admin-auth";

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
        const { action, instructorId, capacity, durationMin, startsAt } = body;

        // Action: Cancel the class session
        if (action === "CANCEL") {
            const result = await prisma.$transaction(async (tx) => {
                const occurrence = await tx.classOccurrence.findUnique({
                    where: { id },
                });

                if (!occurrence) throw new Error("OCCURRENCE_NOT_FOUND");

                // Find all booked attendances
                const bookings = await tx.attendance.findMany({
                    where: {
                        classOccurrenceId: id,
                        status: "BOOKED",
                    },
                });

                // Refund each booked member
                for (const booking of bookings) {
                    // Update attendance status to CANCELLED
                    await tx.attendance.update({
                        where: { id: booking.id },
                        data: { status: "CANCELLED" },
                    });

                    // Find their package to refund
                    const activePkg = await tx.package.findFirst({
                        where: {
                            memberId: booking.memberId,
                            packageOfferId: { not: "pkg_walkin" }, // Walk-in is normally non-refundable
                            status: { in: ["ACTIVE", "EXHAUSTED"] },
                            expiresAt: { gte: new Date() },
                        },
                        orderBy: { expiresAt: "desc" },
                    });

                    if (activePkg && activePkg.classesRemaining !== null) {
                        await tx.package.update({
                            where: { id: activePkg.id },
                            data: {
                                classesRemaining: { increment: 1 },
                                status: "ACTIVE", // Restore active state if exhausted
                            },
                        });
                    }
                }

                // Update bookedCount to 0
                const updated = await tx.classOccurrence.update({
                    where: { id },
                    data: {
                        bookedCount: 0,
                    },
                    include: {
                        template: true,
                        instructor: true,
                    },
                });

                return updated;
            });

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

        const updated = await prisma.classOccurrence.update({
            where: { id },
            data: updateData,
            include: {
                template: true,
                instructor: true,
            },
        });

        return NextResponse.json({ success: true, occurrence: updated });
    } catch (error: any) {
        console.error("[api-admin-classes-patch] Error updating class:", error);
        if (error.message === "OCCURRENCE_NOT_FOUND") {
            return NextResponse.json({ error: "Class session not found." }, { status: 404 });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api-admin-classes-delete] Error deleting class:", error);
        return NextResponse.json({ error: "Failed to delete class session." }, { status: 500 });
    }
}
