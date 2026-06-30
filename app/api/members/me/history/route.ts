import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    let memberId: string | null = null;
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
        }
        try {
            const member = await prisma.member.findUnique({
                where: { lineUserId: lineClaims.lineUserId },
            });
            if (member) {
                memberId = member.id;
            }
        } catch (error) {
            console.error("[api-members-me-history] Error fetching member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    } else if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        memberId = parseSessionCookie(request);
    }

    if (!memberId) {
        return NextResponse.json(
            { error: "Missing or invalid authorization" },
            { status: 401 },
        );
    }

    try {
        const attendances = await prisma.attendance.findMany({
            where: {
                memberId: memberId,
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

        // Map Attendance records to ActivityItem shape expected by the frontend
        const history = attendances.map((att) => {
            let status: "ATTENDED" | "BOOKED" | "CANCELLED" | "NO_SHOW" = "BOOKED";
            if (att.status === "CHECKED_IN") {
                status = "ATTENDED";
            } else if (att.status === "CANCELLED") {
                status = "CANCELLED";
            } else if (att.status === "NO_SHOW") {
                status = "NO_SHOW";
            } else {
                status = "BOOKED";
            }

            return {
                id: att.id,
                template: att.classOccurrence.template,
                instructor: att.classOccurrence.instructor,
                occurredAt: att.classOccurrence.startsAt,
                status,
            };
        });

        // Sort descending by occurredAt (startsAt)
        history.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

        return NextResponse.json({ history });
    } catch (error) {
        console.error("[api-members-me-history] Error fetching class history:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
