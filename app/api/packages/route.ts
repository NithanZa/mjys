import { NextResponse } from "next/server";
import { getCachedPackageOffers } from "@/lib/cache/catalogs";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const offers = await getCachedPackageOffers();
        return NextResponse.json({ offers });
    } catch (error) {
        console.error("[api-packages-get] Error fetching package offers:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
