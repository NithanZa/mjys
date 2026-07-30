import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/home-banners
 * Returns all banners (active + inactive) ordered by sortOrder ascending.
 */
export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const banners = await prisma.homeBanner.findMany({
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error("[api-admin-home-banners-get] Error loading banners:", error);
        return NextResponse.json(
            { error: "Failed to load banners" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/admin/home-banners
 * Creates a new HomeBanner.
 * Required: title, imageUrl, href
 * Optional: eyebrow, sortOrder (defaults to max+1), isActive (defaults true)
 */
export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { title, imageUrl, href, eyebrow, sortOrder, isActive } = body;

        if (!title || !imageUrl || !href) {
            return NextResponse.json(
                { error: "title, imageUrl, and href are required" },
                { status: 400 },
            );
        }

        let finalSortOrder = sortOrder;
        if (finalSortOrder === undefined || finalSortOrder === null) {
            const max = await prisma.homeBanner.aggregate({
                _max: { sortOrder: true },
            });
            finalSortOrder = (max._max.sortOrder ?? 0) + 1;
        }

        const banner = await prisma.homeBanner.create({
            data: {
                title,
                imageUrl,
                href: href.trim(),
                eyebrow: eyebrow || null,
                sortOrder: finalSortOrder,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            },
        });

        return NextResponse.json({ banner }, { status: 201 });
    } catch (error) {
        console.error("[api-admin-home-banners-create] Error creating banner:", error);
        return NextResponse.json(
            { error: "Failed to create banner" },
            { status: 500 },
        );
    }
}
