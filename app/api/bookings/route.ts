import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";

export const dynamic = "force-dynamic";

// GET: Retrieve all active bookings for the logged-in member
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const member = await prisma.member.findUnique({
            where: { lineUserId: lineClaims.lineUserId },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Member not registered" },
                { status: 404 },
            );
        }

        const bookings = await prisma.attendance.findMany({
            where: {
                memberId: member.id,
                status: "BOOKED",
            },
            include: {
                classOccurrence: {
                    include: {
                        template: true,
                        instructor: true,
                    },
                },
            },
        });

        return NextResponse.json({ bookings });
    } catch (error) {
        console.error("[api-bookings-get] Error fetching bookings:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// POST: Book a class occurrence atomically (with concurrency lock & package decrement)
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const { classOccurrenceId } = await request.json();
        if (!classOccurrenceId) {
            return NextResponse.json(
                { error: "classOccurrenceId is required" },
                { status: 400 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch member with their active packages
            const member = await tx.member.findUnique({
                where: { lineUserId: lineClaims.lineUserId },
                include: {
                    packages: {
                        where: {
                            status: "ACTIVE",
                            expiresAt: { gte: new Date() },
                        },
                        orderBy: { expiresAt: "asc" },
                    },
                },
            });

            if (!member) throw new Error("MEMBER_NOT_FOUND");

            // 2. Lock and read the class occurrence
            const occurrence = await tx.classOccurrence.findUnique({
                where: { id: classOccurrenceId },
            });

            if (!occurrence) throw new Error("CLASS_NOT_FOUND");
            if (occurrence.bookedCount >= occurrence.capacity) {
                throw new Error("CLASS_FULL");
            }

            // 3. Check for duplicate active booking
            const duplicate = await tx.attendance.findFirst({
                where: {
                    memberId: member.id,
                    classOccurrenceId,
                    status: "BOOKED",
                },
            });
            if (duplicate) throw new Error("ALREADY_BOOKED");

            // 4. Phase 5 Package Enforcement (if active packages exist, decrement them)
            const activePkg = member.packages[0]; // consume soonest expiring active package
            if (activePkg) {
                if (
                    activePkg.classesRemaining !== null &&
                    activePkg.classesRemaining <= 0
                ) {
                    throw new Error("PACKAGE_EXHAUSTED");
                }
                if (activePkg.classesRemaining !== null) {
                    await tx.package.update({
                        where: { id: activePkg.id },
                        data: {
                            classesRemaining: { decrement: 1 },
                            status:
                                activePkg.classesRemaining - 1 === 0
                                    ? "EXHAUSTED"
                                    : "ACTIVE",
                        },
                    });
                }
            }

            // 5. Atomic increment of bookedCount on class occurrence
            const updatedOccurrence = await tx.classOccurrence.update({
                where: { id: classOccurrenceId },
                data: {
                    bookedCount: { increment: 1 },
                },
            });

            // 6. Create Attendance (Booking) record
            const attendance = await tx.attendance.create({
                data: {
                    memberId: member.id,
                    classOccurrenceId,
                    status: "BOOKED",
                },
            });

            return { attendance, occurrence: updatedOccurrence };
        });

        return NextResponse.json({ success: true, booking: result.attendance });
    } catch (error: any) {
        console.error("[api-bookings-post] Error booking class:", error);
        const msg = error.message;
        if (msg === "MEMBER_NOT_FOUND") {
            return NextResponse.json({ error: "Profile registration required." }, { status: 404 });
        }
        if (msg === "CLASS_NOT_FOUND") {
            return NextResponse.json({ error: "Class session not found." }, { status: 404 });
        }
        if (msg === "CLASS_FULL") {
            return NextResponse.json({ error: "Sorry, this class is fully booked." }, { status: 409 });
        }
        if (msg === "ALREADY_BOOKED") {
            return NextResponse.json({ error: "You already booked this class." }, { status: 409 });
        }
        if (msg === "PACKAGE_EXHAUSTED") {
            return NextResponse.json({ error: "Your package is out of classes." }, { status: 403 });
        }
        return NextResponse.json({ error: "Booking transaction failed." }, { status: 500 });
    }
}

// DELETE: Cancel a booking (with timezone-safe late cancellation check)
export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const urlParams = request.nextUrl.searchParams;
        let classOccurrenceId = urlParams.get("classOccurrenceId");

        if (!classOccurrenceId) {
            const body = await request.json().catch(() => ({}));
            classOccurrenceId = body.classOccurrenceId;
        }

        if (!classOccurrenceId) {
            return NextResponse.json(
                { error: "classOccurrenceId is required" },
                { status: 400 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const member = await tx.member.findUnique({
                where: { lineUserId: lineClaims.lineUserId },
            });
            if (!member) throw new Error("MEMBER_NOT_FOUND");

            // 1. Find the active booking
            const attendance = await tx.attendance.findFirst({
                where: {
                    memberId: member.id,
                    classOccurrenceId: classOccurrenceId as string,
                    status: "BOOKED",
                },
                include: {
                    classOccurrence: true,
                },
            });

            if (!attendance) throw new Error("BOOKING_NOT_FOUND");

            // 2. Perform late cancellation checks (Phase 5: late cancel is < 12 hours)
            const classStartTime = attendance.classOccurrence.startsAt.getTime();
            const now = Date.now();
            const hoursDiff = (classStartTime - now) / (1000 * 60 * 60);
            const isLateCancel = hoursDiff < 12;

            // 3. Delete or transition attendance to CANCELLED
            await tx.attendance.update({
                where: { id: attendance.id },
                data: { status: "CANCELLED" },
            });

            // 4. Atomic decrement of bookedCount on class occurrence
            await tx.classOccurrence.update({
                where: { id: classOccurrenceId as string },
                data: {
                    bookedCount: { decrement: 1 },
                },
            });

            // 5. Refund package class if cancellation is early (not late)
            if (!isLateCancel) {
                // Find member's active packages or packages that were exhausted recently
                const activePkg = await tx.package.findFirst({
                    where: {
                        memberId: member.id,
                        packageOfferId: { not: "pkg_walkin" }, // Walk-ins typically not refundable or handled differently
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
                            status: "ACTIVE", // restore active status if previously exhausted
                        },
                    });
                }
            }

            return { isLateCancel };
        });

        return NextResponse.json({ success: true, isLateCancel: result.isLateCancel });
    } catch (error: any) {
        console.error("[api-bookings-delete] Error cancelling booking:", error);
        const msg = error.message;
        if (msg === "MEMBER_NOT_FOUND") {
            return NextResponse.json({ error: "Profile registration required." }, { status: 404 });
        }
        if (msg === "BOOKING_NOT_FOUND") {
            return NextResponse.json({ error: "Active booking not found." }, { status: 404 });
        }
        return NextResponse.json({ error: "Cancellation transaction failed." }, { status: 500 });
    }
}
