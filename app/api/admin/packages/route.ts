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

/**
 * POST /api/admin/packages
 * Creates a new PackageOffer.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            type,
            priceTHB,
            classCount,
            validityDays,
            tagline,
            perks,
            highlight,
            sortOrder,
            active,
        } = body;

        // Validation
        if (!name || !type || priceTHB === undefined || !validityDays || !tagline || sortOrder === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: name, type, priceTHB, validityDays, tagline, sortOrder" },
                { status: 400 },
            );
        }

        // Validate type is valid PackageType enum
        const validTypes = ["CLASSES_5", "CLASSES_10", "CLASSES_20", "UNLIMITED", "WALK_IN"];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid package type. Must be one of: ${validTypes.join(", ")}` },
                { status: 400 },
            );
        }

        const offer = await prisma.packageOffer.create({
            data: {
                name,
                type,
                priceTHB: parseInt(priceTHB, 10),
                classCount: classCount !== null && classCount !== undefined ? parseInt(classCount, 10) : null,
                validityDays: parseInt(validityDays, 10),
                tagline,
                perks: Array.isArray(perks) ? perks : [],
                highlight: Boolean(highlight),
                sortOrder: parseInt(sortOrder, 10),
                active: active !== undefined ? Boolean(active) : true,
            },
        });

        return NextResponse.json({ success: true, offer });
    } catch (error) {
        console.error("[api-admin-packages-post] Error creating package offer:", error);
        return NextResponse.json({ error: "Failed to create package offer" }, { status: 500 });
    }
}
