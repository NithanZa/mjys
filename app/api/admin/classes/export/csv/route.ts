import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { STUDIO_TZ } from "@/lib/dates";

export const dynamic = "force-dynamic";

const CSV_HEADER = [
    "id",
    "name",
    "description",
    "tagline",
    "intensity",
    "isSpecial",
    "specialPriceTHB",
    "instructorId",
    "instructorName",
    "startsAt",
    "durationMin",
    "capacity",
    "bookedCount",
];

function escapeCsv(value: unknown): string {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    try {
        const where: any = { isCancelled: false };
        if (startStr && endStr) {
            where.startsAt = {
                gte: new Date(startStr),
                lte: new Date(endStr),
            };
        }

        const occurrences = await prisma.classOccurrence.findMany({
            where,
            include: { instructor: true },
            orderBy: { startsAt: "asc" },
        });

        const rows = occurrences.map((occ) => [
            occ.id,
            occ.name,
            occ.description,
            occ.tagline,
            occ.intensity,
            occ.isSpecial ? "true" : "false",
            occ.specialPriceTHB ?? "",
            occ.instructorId,
            occ.instructor.name,
            `${format(toZonedTime(occ.startsAt, STUDIO_TZ), "yyyy-MM-dd'T'HH:mm:ss")}+07:00`,
            occ.durationMin,
            occ.capacity,
            occ.bookedCount,
        ]);

        const csv = [CSV_HEADER.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="classes-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error("[api-admin-classes-export-csv] Error:", error);
        return NextResponse.json({ error: "Failed to export classes" }, { status: 500 });
    }
}
