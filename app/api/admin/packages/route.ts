import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/packages
 * Fetches all PackageOffer rows sorted by display order.
 */
export async function GET() {
    try {
        const offers = await prisma.packageOffer.findMany({
            orderBy: { sortOrder: "asc" },
        });
        return NextResponse.json({ offers });
    } catch (error) {
        console.error("[api-admin-packages-get] Error loading packages:", error);
        return NextResponse.json({ error: "Failed to load package offers" }, { status: 500 });
    }
}
