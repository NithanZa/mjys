import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { endOfDay, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getCachedClassOccurrences } from "@/lib/cache/classes";
import { STUDIO_TZ } from "@/lib/dates";

export const dynamic = "force-dynamic";
const MAX_RANGE_MS = 120 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
    const fromStr = request.nextUrl.searchParams.get("from");
    const toStr = request.nextUrl.searchParams.get("to");

    if (!fromStr || !toStr) {
        return NextResponse.json(
            { error: "from and to parameters are required" },
            { status: 400 },
        );
    }

    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (
        Number.isNaN(from.getTime()) ||
        Number.isNaN(to.getTime()) ||
        to <= from ||
        to.getTime() - from.getTime() > MAX_RANGE_MS
    ) {
        return NextResponse.json(
            { error: "from and to must define an increasing range of at most 120 days" },
            { status: 400 },
        );
    }

    try {
        const canonicalFrom = fromZonedTime(
            startOfDay(toZonedTime(from, STUDIO_TZ)),
            STUDIO_TZ,
        );
        const canonicalTo = fromZonedTime(
            endOfDay(toZonedTime(to, STUDIO_TZ)),
            STUDIO_TZ,
        );
        const occurrences = await getCachedClassOccurrences(
            canonicalFrom.toISOString(),
            canonicalTo.toISOString(),
        );

        return NextResponse.json({ occurrences });
    } catch (error) {
        console.error("[api-classes] Error fetching classes:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    // Allows retrieving a single occurrence detail if requested
    try {
        const { occurrenceId } = await request.json();
        if (!occurrenceId) {
            return NextResponse.json(
                { error: "occurrenceId is required" },
                { status: 400 },
            );
        }

        const occurrence = await prisma.classOccurrence.findUnique({
            where: { id: occurrenceId },
            include: {
                instructor: true,
            },
        });

        if (!occurrence) {
            return NextResponse.json(
                { error: "Class occurrence not found" },
                { status: 404 },
            );
        }

        const occurrenceWithSlots = {
            ...occurrence,
            slotsLeft: Math.max(0, occurrence.capacity - occurrence.bookedCount),
        };

        return NextResponse.json({ occurrence: occurrenceWithSlots });
    } catch (error) {
        console.error("[api-classes-post] Error fetching single occurrence:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
