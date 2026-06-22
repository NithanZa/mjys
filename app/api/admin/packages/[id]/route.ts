import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/packages/[id]
 * Updates properties of a specific PackageOffer (name, priceTHB, tagline, perks, active, highlight, sortOrder).
 */
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    try {
        const body = await request.json();
        const { name, priceTHB, tagline, perks, active, highlight, sortOrder } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (priceTHB !== undefined) updateData.priceTHB = parseInt(priceTHB, 10);
        if (tagline !== undefined) updateData.tagline = tagline;
        if (perks !== undefined) updateData.perks = perks;
        if (active !== undefined) updateData.active = Boolean(active);
        if (highlight !== undefined) updateData.highlight = Boolean(highlight);
        if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

        const updated = await prisma.packageOffer.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, offer: updated });
    } catch (error) {
        console.error("[api-admin-packages-patch] Error updating package offer:", error);
        return NextResponse.json({ error: "Failed to update package offer" }, { status: 500 });
    }
}
