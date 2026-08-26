import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";
import type { Member } from "@/generated/prisma/client";
import { usableLotsWhere } from "@/lib/packages/balance";
import { CACHE_TAGS, expireCacheTag } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

// Rate limiting: track recent booking/cancellation actions per member
// Key: memberId:classOccurrenceId, Value: timestamp of last action
const recentActions = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 2000; // 2 seconds between actions on same class

function checkRateLimit(memberId: string, classOccurrenceId: string): boolean {
    const key = `${memberId}:${classOccurrenceId}`;
    const lastAction = recentActions.get(key);
    const now = Date.now();

    if (lastAction && now - lastAction < RATE_LIMIT_COOLDOWN_MS) {
        return false; // Rate limited
    }

    recentActions.set(key, now);
    // Clean up old entries to prevent memory leak
    if (recentActions.size > 10000) {
        const cutoff = now - 60000; // Keep last 60 seconds
        for (const [k, v] of recentActions.entries()) {
            if (v < cutoff) recentActions.delete(k);
        }
    }

    return true; // Not rate limited
}

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

        const specialOccurrenceIds = bookings
            .filter((booking) => booking.classOccurrence.isSpecial)
            .map((booking) => booking.classOccurrenceId);
        const paidSpecialOccurrenceIds = new Set(
            specialOccurrenceIds.length
                ? (
                    await prisma.pendingPurchase.findMany({
                        where: {
                            memberId: member.id,
                            classOccurrenceId: { in: specialOccurrenceIds },
                            kind: "SPECIAL_CLASS",
                            status: "APPROVED",
                        },
                        select: { classOccurrenceId: true },
                    })
                ).flatMap((purchase) => purchase.classOccurrenceId ?? [])
                : [],
        );

        return NextResponse.json({
            bookings: bookings.map((booking) => ({
                ...booking,
                isPaidSpecial: paidSpecialOccurrenceIds.has(booking.classOccurrenceId),
            })),
        });
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

        // Rate limiting check
        if (!checkRateLimit(resolvedMember.id, classOccurrenceId)) {
            return NextResponse.json(
                { error: "Please wait a moment before booking another class." },
                { status: 429 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const now = new Date();
            // 1. Fetch member with their usable credit lots
            const member = await tx.member.findUnique({
                where: { id: resolvedMember.id },
                include: {
                    packages: {
                        where: usableLotsWhere(now),
                        orderBy: [
                            { expiresAt: "asc" },
                            { createdAt: "asc" },
                        ],
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

            // 4. Entitlement check — branch on isSpecial
            let consumedPackageId: string | null = null;
            if (occurrence.isSpecial) {
                // Special classes require an approved SPECIAL_CLASS purchase for this exact occurrence.
                // Package credits are never consumed.
                const approvedPurchase = await tx.pendingPurchase.findFirst({
                    where: {
                        memberId: member.id,
                        classOccurrenceId,
                        kind: "SPECIAL_CLASS",
                        status: "APPROVED",
                    },
                });
                if (!approvedPurchase) throw new Error("SPECIAL_ADMISSION_REQUIRED");
            } else {
                // Normal class: require and consume the soonest-expiring lot.
                const creditLot = member.packages[0];
                if (!creditLot) throw new Error("NO_REMAINING_CLASSES");

                // The remaining-count predicate prevents concurrent requests
                // from spending the final class twice.
                const debit = await tx.package.updateMany({
                    where: {
                        id: creditLot.id,
                        classesRemaining: { gt: 0 },
                        expiresAt: { gte: now },
                    },
                    data: {
                        classesRemaining: { decrement: 1 },
                    },
                });
                if (debit.count !== 1) throw new Error("NO_REMAINING_CLASSES");
                const debitedLot = await tx.package.findUniqueOrThrow({
                    where: { id: creditLot.id },
                    select: { classesRemaining: true },
                });
                await tx.package.update({
                    where: { id: creditLot.id },
                    data: {
                        status:
                            debitedLot.classesRemaining === 0
                                ? "EXHAUSTED"
                                : "ACTIVE",
                    },
                });
                consumedPackageId = creditLot.id;
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
                    consumedPackageId,
                    status: "BOOKED",
                },
            });

            return { attendance, occurrence: updatedOccurrence };
        });

        expireCacheTag(CACHE_TAGS.classes);
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
        if (msg === "NO_REMAINING_CLASSES") {
            return NextResponse.json(
                { error: "You have no classes left. Buy a pack to book." },
                { status: 403 },
            );
        }
        if (msg === "SPECIAL_ADMISSION_REQUIRED") {
            return NextResponse.json(
                { error: "This special class requires an approved payment. Please submit a payment slip first." },
                { status: 403 },
            );
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

        // Rate limiting check
        if (!checkRateLimit(resolvedMember.id, classOccurrenceId)) {
            return NextResponse.json(
                { error: "Please wait a moment before cancelling another class." },
                { status: 429 },
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
                    consumedPackage: {
                        include: { offer: true },
                    },
                },
            });

            if (!attendance) throw new Error("BOOKING_NOT_FOUND");

            if (attendance.classOccurrence.isSpecial) {
                const paidSpecialPurchase = await tx.pendingPurchase.findFirst({
                    where: {
                        memberId: member.id,
                        classOccurrenceId: attendance.classOccurrenceId,
                        kind: "SPECIAL_CLASS",
                        status: "APPROVED",
                    },
                    select: { id: true },
                });
                if (paidSpecialPurchase) {
                    throw new Error("PAID_SPECIAL_CANCELLATION_CONTACT_STUDIO");
                }
            }

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

            // 5. Refund package class if cancellation is early (not late) — only for normal classes
            if (!isLateCancel && !attendance.classOccurrence.isSpecial) {
                const nowDate = new Date();
                let creditLot = attendance.consumedPackage;

                // Legacy bookings have no consumedPackageId. Restore to the
                // soonest-expiring usable non-walk-in lot as a safe fallback.
                if (!creditLot) {
                    creditLot = await tx.package.findFirst({
                        where: {
                            memberId: member.id,
                            ...usableLotsWhere(nowDate),
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
                    creditLot.expiresAt >= nowDate
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

            return { isLateCancel };
        });

        expireCacheTag(CACHE_TAGS.classes);
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
        if (msg === "PAID_SPECIAL_CANCELLATION_CONTACT_STUDIO") {
            return NextResponse.json(
                {
                    code: "PAID_SPECIAL_CANCELLATION_CONTACT_STUDIO",
                    error: "This paid special-class booking must be changed through the studio. Please contact us for help.",
                },
                { status: 409 },
            );
        }
        return NextResponse.json({ error: "Cancellation transaction failed." }, { status: 500 });
    }
}
