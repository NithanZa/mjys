import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodeMemberPassSecure } from "@/lib/qr";
import { newlyCrossedThresholds } from "@/lib/levels";
import { studioToday } from "@/lib/dates";
import { addDays } from "date-fns";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/scanner/verify
 * Scans a customer's Member Pass QR token, verifies their booking,
 * and performs an atomic on-day check-in.
 * Supports manual check-in via forceMemberId.
 */
export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const { token, forceMemberId } = await request.json();
        let memberId: string | null = null;

        if (forceMemberId) {
            // Manual check-in override
            memberId = forceMemberId;
        } else if (token) {
            // Secure QR decoding
            memberId = await decodeMemberPassSecure(token);
        }

        if (!memberId) {
            return NextResponse.json(
                { error: "Invalid or expired QR Member Pass token. Please try again." },
                { status: 400 },
            );
        }

        // Run the entire check-in workflow inside a safe database transaction
        const checkInResult = await prisma.$transaction(async (tx) => {
            // 1. Resolve member
            const member = await tx.member.findUnique({
                where: { id: memberId },
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

            // 2. Look up today's scheduled classes for this member's booking
            const today = studioToday();
            const tomorrow = addDays(today, 1);

            const booking = await tx.attendance.findFirst({
                where: {
                    memberId: member.id,
                    status: "BOOKED",
                    classOccurrence: {
                        startsAt: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                },
                include: {
                    classOccurrence: {
                        include: {
                            instructor: true,
                        },
                    },
                },
                orderBy: {
                    classOccurrence: {
                        startsAt: "asc",
                    },
                },
            });

            if (!booking) throw new Error("NO_BOOKINGS_TODAY");

            // 3. Complete checkout and check-in steps
            const prevAttended = member.classesAttended;
            const newAttended = prevAttended + 1;

            // Update member's classesAttended count
            const updatedMember = await tx.member.update({
                where: { id: member.id },
                data: {
                    classesAttended: newAttended,
                },
            });

            // Update attendance status to CHECKED_IN
            const updatedAttendance = await tx.attendance.update({
                where: { id: booking.id },
                data: {
                    status: "CHECKED_IN",
                    checkedInAt: new Date(),
                },
            });

            // 4. Calculate milestone unlocks
            const crossed = newlyCrossedThresholds(prevAttended, newAttended);
            const unlockedMilestones: string[] = [];

            for (const threshold of crossed) {
                // Determine milestone code based on threshold
                const milestoneCode = `milestone_${threshold}`;
                const milestone = await tx.milestone.findUnique({
                    where: { code: milestoneCode },
                });

                if (milestone) {
                    await tx.memberMilestone.create({
                        data: {
                            memberId: member.id,
                            milestoneId: milestone.id,
                            unlockedAt: new Date(),
                        },
                    });
                    unlockedMilestones.push(milestone.name);
                }
            }

            // Check if member needs level upgrade
            let newLevel = member.level;
            if (newAttended >= 100) {
                newLevel = "LEOPARD";
            } else if (newAttended >= 50) {
                newLevel = "LEOPARD";
            } else if (newAttended >= 20) {
                newLevel = "TIGER";
            }

            if (newLevel !== member.level) {
                await tx.member.update({
                    where: { id: member.id },
                    data: {
                        level: newLevel,
                    },
                });
            }

            return {
                member: updatedMember,
                booking: updatedAttendance,
                classOccurrence: booking.classOccurrence,
                unlockedMilestones,
                newLevelCrossed: newLevel !== member.level ? newLevel : null,
            };
        });

        return NextResponse.json({
            success: true,
            ...checkInResult,
        });
    } catch (error: any) {
        console.error("[api-scanner-verify] Check-In failure:", error);
        const msg = error.message;
        if (msg === "MEMBER_NOT_FOUND") {
            return NextResponse.json({ error: "Customer profile not registered." }, { status: 404 });
        }
        if (msg === "NO_BOOKINGS_TODAY") {
            return NextResponse.json(
                { error: "No active booking found for today. Please ask the member to book the class first." },
                { status: 404 },
            );
        }
        return NextResponse.json({ error: "Check-in transaction aborted. Database issue." }, { status: 500 });
    }
}
