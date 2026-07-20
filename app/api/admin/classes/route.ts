import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseISO } from "date-fns";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, description, tagline, intensity, isSpecial, instructorId, startsAt, durationMin, capacity } = body;

        // Validation
        if (!name || !instructorId || !startsAt || !durationMin || !capacity) {
            return NextResponse.json(
                { error: "Missing required fields: name, instructorId, startsAt, durationMin, capacity" },
                { status: 400 },
            );
        }

        // Validate instructor exists
        const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
        if (!instructor) {
            return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
        }

        const occurrence = await prisma.classOccurrence.create({
            data: {
                name,
                description: description ?? "",
                tagline: tagline ?? "",
                intensity: intensity ?? "Balanced",
                isSpecial: Boolean(isSpecial),
                instructorId,
                startsAt: parseISO(startsAt),
                durationMin: parseInt(durationMin, 10),
                capacity: parseInt(capacity, 10),
                bookedCount: 0,
            },
            include: {
                instructor: true,
            },
        });

        return NextResponse.json({ success: true, occurrence });
    } catch (error) {
        console.error("[api-admin-classes-post] Error creating class occurrence:", error);
        return NextResponse.json({ error: "Failed to schedule class occurrence" }, { status: 500 });
    }
}
