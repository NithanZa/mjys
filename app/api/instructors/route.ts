import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const instructors = await prisma.instructor.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json({ instructors });
    } catch (error) {
        console.error("[api-instructors] Error fetching instructors:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
