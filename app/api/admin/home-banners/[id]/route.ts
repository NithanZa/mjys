import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { BANNER_BUCKET, extractBannerPath } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/home-banners/[id]
 * Updates any subset of title, eyebrow, imageUrl, href, sortOrder, isActive.
 * If imageUrl changes and the old one pointed into the banners bucket,
 * best-effort deletes the old object from storage.
 */
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { id } = await props.params;
    try {
        const body = await request.json();
        const { title, eyebrow, imageUrl, href, sortOrder, isActive } = body;

        const existing = await prisma.homeBanner.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Banner not found" },
                { status: 404 },
            );
        }

        const data: Record<string, unknown> = {};
        if (title !== undefined) data.title = title;
        if (eyebrow !== undefined) data.eyebrow = eyebrow || null;
        if (href !== undefined) data.href = String(href).trim();
        if (sortOrder !== undefined) data.sortOrder = sortOrder;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        if (imageUrl !== undefined && imageUrl !== existing.imageUrl) {
            data.imageUrl = imageUrl;
            // Best-effort delete old image from banners bucket
            const oldPath = extractBannerPath(existing.imageUrl);
            if (oldPath && oldPath !== existing.imageUrl) {
                const { error: removeError } = await supabase.storage
                    .from(BANNER_BUCKET)
                    .remove([oldPath]);
                if (removeError) {
                    console.error("[api-admin-home-banners-patch] Failed to delete old banner image:", removeError);
                }
            }
        }

        const updated = await prisma.homeBanner.update({
            where: { id },
            data,
        });

        return NextResponse.json({ banner: updated });
    } catch (error) {
        console.error("[api-admin-home-banners-patch] Error updating banner:", error);
        return NextResponse.json(
            { error: "Failed to update banner" },
            { status: 500 },
        );
    }
}

/**
 * DELETE /api/admin/home-banners/[id]
 * Deletes the banner row and best-effort deletes its image from storage.
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { id } = await props.params;
    try {
        const existing = await prisma.homeBanner.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Banner not found" },
                { status: 404 },
            );
        }

        // Best-effort delete image from banners bucket
        const path = extractBannerPath(existing.imageUrl);
        if (path && path !== existing.imageUrl) {
            const { error: removeError } = await supabase.storage
                .from(BANNER_BUCKET)
                .remove([path]);
            if (removeError) {
                console.error("[api-admin-home-banners-delete] Failed to delete banner image:", removeError);
            }
        }

        await prisma.homeBanner.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api-admin-home-banners-delete] Error deleting banner:", error);
        return NextResponse.json(
            { error: "Failed to delete banner" },
            { status: 500 },
        );
    }
}
