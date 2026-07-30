import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/home-banners
 * Public endpoint — returns only active banners ordered by sortOrder ascending.
 */
export async function GET() {
    try {
        const banners = await prisma.homeBanner.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                title: true,
                eyebrow: true,
                imageUrl: true,
                href: true,
                sortOrder: true,
            },
        });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error("[api-home-banners-get] Error loading banners:", error);
        return NextResponse.json(
            { error: "Failed to load banners" },
            { status: 500 },
        );
    }
}
