import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const fromStr = request.nextUrl.searchParams.get("from");
    const toStr = request.nextUrl.searchParams.get("to");

    if (!fromStr || !toStr) {
        return NextResponse.json(
            { error: "from and to parameters are required" },
            { status: 400 },
        );
    }

    try {
        const occurrences = await prisma.classOccurrence.findMany({
            where: {
                startsAt: {
                    gte: new Date(fromStr),
                    lte: new Date(toStr),
                },
            },
            include: {
                template: true,
                instructor: true,
            },
            orderBy: {
                startsAt: "asc",
            },
        });

        // Compute slotsLeft dynamically for each occurrence
        const occurrencesWithSlots = occurrences.map((occ) => ({
            ...occ,
            slotsLeft: Math.max(0, occ.capacity - occ.bookedCount),
        }));

        return NextResponse.json({ occurrences: occurrencesWithSlots });
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
                template: true,
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
