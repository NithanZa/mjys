import { NextResponse } from "next/server";
import { getCachedInstructors } from "@/lib/cache/classes";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const instructors = await getCachedInstructors();
        return NextResponse.json({ instructors });
    } catch (error) {
        console.error("[api-instructors] Error fetching instructors:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
