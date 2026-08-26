import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getCachedAdminCalendar } from "@/lib/cache/classes";
import { startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";

export const dynamic = "force-dynamic";
const MAX_RANGE_MS = 120 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");
    if (!startStr || !endStr) {
        return NextResponse.json(
            { error: "start and end parameters are required" },
            { status: 400 },
        );
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start ||
        end.getTime() - start.getTime() > MAX_RANGE_MS
    ) {
        return NextResponse.json(
            { error: "start and end must define an increasing range of at most 120 days" },
            { status: 400 },
        );
    }

    try {
        const canonicalStart = fromZonedTime(
            startOfDay(toZonedTime(start, STUDIO_TZ)),
            STUDIO_TZ,
        );
        const canonicalEnd = fromZonedTime(
            startOfDay(toZonedTime(end, STUDIO_TZ)),
            STUDIO_TZ,
        );
        if (canonicalEnd <= canonicalStart) {
            return NextResponse.json(
                { error: "start and end must span at least one studio day" },
                { status: 400 },
            );
        }
        const data = await getCachedAdminCalendar(
            canonicalStart.toISOString(),
            canonicalEnd.toISOString(),
        );
        return NextResponse.json(data);
    } catch (error) {
        console.error("[api-admin-calendar] Error loading calendar data:", error);
        return NextResponse.json({ error: "Failed to load calendar data" }, { status: 500 });
    }
}
