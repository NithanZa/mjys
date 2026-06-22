import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    try {
        const roster = await prisma.attendance.findMany({
            where: {
                classOccurrenceId: id,
                status: "BOOKED",
            },
            include: {
                member: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({ roster });
    } catch (error) {
        console.error("[api-admin-roster] Error loading roster:", error);
        return NextResponse.json({ error: "Failed to load class roster" }, { status: 500 });
    }
}
