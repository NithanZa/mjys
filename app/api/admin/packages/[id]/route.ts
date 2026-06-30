import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/packages/[id]
 * Updates properties of a specific PackageOffer (name, type, priceTHB, classCount, validityDays, tagline, perks, active, highlight, sortOrder).
 */
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    try {
        const body = await request.json();
        const { name, type, priceTHB, classCount, validityDays, tagline, perks, active, highlight, sortOrder } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) {
            const validTypes = ["CLASSES_5", "CLASSES_10", "CLASSES_20", "UNLIMITED", "WALK_IN"];
            if (!validTypes.includes(type)) {
                return NextResponse.json(
                    { error: `Invalid package type. Must be one of: ${validTypes.join(", ")}` },
                    { status: 400 },
                );
            }
            updateData.type = type;
        }
        if (priceTHB !== undefined) updateData.priceTHB = parseInt(priceTHB, 10);
        if (classCount !== undefined) updateData.classCount = classCount !== null ? parseInt(classCount, 10) : null;
        if (validityDays !== undefined) updateData.validityDays = parseInt(validityDays, 10);
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

/**
 * DELETE /api/admin/packages/[id]
 * Deletes a package offer, optionally moving current members' packages to another package offer, or cascading deletes.
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const { id } = await props.params;
    try {
        let action = "CASCADE";
        let targetOfferId: string | null = null;

        try {
            const body = await request.json();
            action = body.action || "CASCADE";
            targetOfferId = body.targetOfferId || null;
        } catch {
            // Fallback for requests without JSON body (e.g. from simpler clients)
            const { searchParams } = new URL(request.url);
            action = searchParams.get("action") || "CASCADE";
            targetOfferId = searchParams.get("targetOfferId");
        }

        // Validate package offer exists
        const offer = await prisma.packageOffer.findUnique({
            where: { id },
        });

        if (!offer) {
            return NextResponse.json({ error: "Package offer not found" }, { status: 404 });
        }

        if (action === "MOVE") {
            if (!targetOfferId) {
                return NextResponse.json(
                    { error: "Target package offer ID is required for MOVE action" },
                    { status: 400 },
                );
            }

            // Check if target offer exists
            const targetOffer = await prisma.packageOffer.findUnique({
                where: { id: targetOfferId },
            });

            if (!targetOffer) {
                return NextResponse.json({ error: "Target package offer not found" }, { status: 404 });
            }

            if (targetOfferId === id) {
                return NextResponse.json(
                    { error: "Cannot move members to the package being deleted" },
                    { status: 400 },
                );
            }

            // Move members' packages and pending purchases to the target package offer, then delete
            await prisma.$transaction([
                prisma.package.updateMany({
                    where: { packageOfferId: id },
                    data: { packageOfferId: targetOfferId },
                }),
                prisma.pendingPurchase.updateMany({
                    where: { packageOfferId: id },
                    data: { packageOfferId: targetOfferId },
                }),
                prisma.packageOffer.delete({
                    where: { id },
                }),
            ]);
        } else {
            // CASCADE delete (Prisma's Cascade constraints will delete packages and pending purchases)
            await prisma.packageOffer.delete({
                where: { id },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api-admin-packages-delete] Error deleting package offer:", error);
        return NextResponse.json({ error: "Failed to delete package offer" }, { status: 500 });
    }
}
