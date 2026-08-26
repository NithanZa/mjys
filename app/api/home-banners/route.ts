import { NextResponse } from "next/server";
import { getCachedHomeBanners } from "@/lib/cache/catalogs";

export const dynamic = "force-dynamic";

/**
 * GET /api/home-banners
 * Public endpoint — returns only active banners ordered by sortOrder ascending.
 */
export async function GET() {
    try {
        const banners = await getCachedHomeBanners();

        return NextResponse.json({ banners });
    } catch (error) {
        console.error("[api-home-banners-get] Error loading banners:", error);
        return NextResponse.json(
            { error: "Failed to load banners" },
            { status: 500 },
        );
    }
}
