import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const offers = await prisma.packageOffer.findMany({
            where: { active: true },
            orderBy: { sortOrder: "asc" },
        });
        return NextResponse.json({ offers });
    } catch (error) {
        console.error("[api-packages-get] Error fetching package offers:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
