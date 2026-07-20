import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    try {
        // Build occurrence where clause with optional range
        const where: any = {};
        if (startStr && endStr) {
            where.startsAt = {
                gte: parseISO(startStr),
                lte: parseISO(endStr),
            };
        }

        // Fetch occurrences with instructor relation
        const [occurrences, instructors] = await Promise.all([
            prisma.classOccurrence.findMany({
                where,
                include: {
                    instructor: true,
                },
                orderBy: { startsAt: "asc" },
            }),
            prisma.instructor.findMany({
                orderBy: { order: "asc" },
            }),
        ]);

        return NextResponse.json({
            occurrences,
            instructors,
        });
    } catch (error) {
        console.error("[api-admin-calendar] Error loading calendar data:", error);
        return NextResponse.json({ error: "Failed to load calendar data" }, { status: 500 });
    }
}
