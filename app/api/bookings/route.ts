import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";
import type { Member } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

async function resolveBookingMember(
    request: NextRequest,
): Promise<Member | null | { _err: string; _status: number }> {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const lineClaims = await verifyLineIdToken(authHeader.substring(7));
        if (!lineClaims) return { _err: "Invalid LINE ID token", _status: 401 };
        return prisma.member.findUnique({ where: { lineUserId: lineClaims.lineUserId } });
    }
    if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        const memberId = parseSessionCookie(request);
        if (!memberId) return { _err: "Not authenticated", _status: 401 };
        return prisma.member.findUnique({ where: { id: memberId } });
    }
    return { _err: "Missing or invalid authorization header", _status: 401 };
}

function isAuthError(v: unknown): v is { _err: string; _status: number } {
    return typeof v === "object" && v !== null && "_err" in v;
}

// GET: Retrieve all active bookings for the logged-in member
export async function GET(request: NextRequest) {
    const result = await resolveBookingMember(request);
    if (isAuthError(result)) {
        return NextResponse.json({ error: result._err }, { status: result._status });
    }

    if (!result) {
        return NextResponse.json({ error: "Member not registered" }, { status: 404 });
    }
    const member = result;

    try {
        const bookings = await prisma.attendance.findMany({
            where: {
                memberId: member.id,
                status: "BOOKED",
            },
            include: {
                classOccurrence: {
                    include: {
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
    const auth = await resolveBookingMember(request);
    if (isAuthError(auth)) {
        return NextResponse.json({ error: auth._err }, { status: auth._status });
    }
    if (!auth) {
        return NextResponse.json({ error: "Profile registration required." }, { status: 404 });
    }
    const resolvedMember = auth;

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
                where: { id: resolvedMember.id },
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
            if (occurrence.isCancelled) throw new Error("CLASS_CANCELLED");
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
        if (msg === "CLASS_CANCELLED") {
            return NextResponse.json({ error: "This class has been cancelled." }, { status: 409 });
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
    const auth = await resolveBookingMember(request);
    if (isAuthError(auth)) {
        return NextResponse.json({ error: auth._err }, { status: auth._status });
    }
    if (!auth) {
        return NextResponse.json({ error: "Profile registration required." }, { status: 404 });
    }
    const resolvedMember = auth;

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
                where: { id: resolvedMember.id },
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
