import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { CACHE_TAGS, expireCacheTag } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/staff/[id]
 * Updates any subset of name, title, bio, photoUrl, initials, order, slug.
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
        const { name, title, bio, photoUrl, initials, order, slug } = body;

        const existing = await prisma.instructor.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Staff member not found" },
                { status: 404 },
            );
        }

        // If slug is changing, ensure uniqueness
        let finalSlug = slug;
        if (finalSlug && finalSlug !== existing.slug) {
            const conflict = await prisma.instructor.findUnique({
                where: { slug: finalSlug },
            });
            if (conflict && conflict.id !== id) {
                finalSlug = await uniqueSlug(finalSlug);
            }
        }

        const data: Record<string, unknown> = {};
        if (name !== undefined) data.name = name;
        if (title !== undefined) data.title = title;
        if (bio !== undefined) data.bio = bio;
        if (photoUrl !== undefined) data.photoUrl = photoUrl || null;
        if (initials !== undefined) data.initials = initials;
        if (order !== undefined) data.order = order;
        if (finalSlug !== undefined) data.slug = finalSlug;

        const updated = await prisma.instructor.update({
            where: { id },
            data,
        });

        expireCacheTag(CACHE_TAGS.instructors);
        expireCacheTag(CACHE_TAGS.classes);
        return NextResponse.json({ instructor: updated });
    } catch (error) {
        console.error("[api-admin-staff-update] Error updating staff:", error);
        return NextResponse.json(
            { error: "Failed to update staff member" },
            { status: 500 },
        );
    }
}

/**
 * DELETE /api/admin/staff/[id]
 * Deletes the instructor. If they have non-cancelled future ClassOccurrences,
 * requires ?confirm=true to proceed (returns 409 with count otherwise).
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm") === "true";

    try {
        const existing = await prisma.instructor.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { error: "Staff member not found" },
                { status: 404 },
            );
        }

        // Check for upcoming non-cancelled occurrences
        const upcomingCount = await prisma.classOccurrence.count({
            where: {
                instructorId: id,
                isCancelled: false,
                startsAt: { gte: new Date() },
            },
        });

        if (upcomingCount > 0 && !confirm) {
            return NextResponse.json(
                {
                    error: "This staff member has upcoming scheduled classes.",
                    upcomingCount,
                    requiresConfirm: true,
                },
                { status: 409 },
            );
        }

        await prisma.instructor.delete({ where: { id } });

        expireCacheTag(CACHE_TAGS.instructors);
        expireCacheTag(CACHE_TAGS.classes);
        return NextResponse.json({
            success: true,
            message: "Staff member deleted successfully.",
        });
    } catch (error) {
        console.error("[api-admin-staff-delete] Error deleting staff:", error);
        return NextResponse.json(
            { error: "Failed to delete staff member" },
            { status: 500 },
        );
    }
}

async function uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await prisma.instructor.findUnique({
            where: { slug: candidate },
        });
        if (!existing) return candidate;
        candidate = `${base}-${suffix}`;
        suffix++;
    }
}
