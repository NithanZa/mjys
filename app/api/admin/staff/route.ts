import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/staff
 * Returns all instructors (staff) ordered by `order` ascending.
 */
export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const instructors = await prisma.instructor.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: {
                    select: {
                        occurrences: {
                            where: {
                                isCancelled: false,
                                startsAt: { gte: new Date() },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ instructors });
    } catch (error) {
        console.error("[api-admin-staff-get] Error loading staff:", error);
        return NextResponse.json(
            { error: "Failed to load staff directory" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/admin/staff
 * Creates a new instructor record.
 * Required: name, title, bio, initials
 * Optional: photoUrl, order (defaults to max+1), slug (auto-generated from name)
 */
export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, title, bio, initials, photoUrl, order, slug } = body;

        if (!name || !title || !bio || !initials) {
            return NextResponse.json(
                { error: "name, title, bio, and initials are required" },
                { status: 400 },
            );
        }

        // Auto-generate slug from name if not provided
        let finalSlug = slug || slugify(name);

        // Ensure slug uniqueness
        const existing = await prisma.instructor.findUnique({
            where: { slug: finalSlug },
        });
        if (existing) {
            finalSlug = await uniqueSlug(finalSlug);
        }

        // Default order to max+1 if not provided
        let finalOrder = order;
        if (finalOrder === undefined || finalOrder === null) {
            const maxOrder = await prisma.instructor.aggregate({
                _max: { order: true },
            });
            finalOrder = (maxOrder._max.order ?? 0) + 1;
        }

        const instructor = await prisma.instructor.create({
            data: {
                slug: finalSlug,
                name,
                title,
                bio,
                initials,
                photoUrl: photoUrl || null,
                order: finalOrder,
            },
        });

        return NextResponse.json({ instructor }, { status: 201 });
    } catch (error) {
        console.error("[api-admin-staff-create] Error creating staff:", error);
        return NextResponse.json(
            { error: "Failed to create staff member" },
            { status: 500 },
        );
    }
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
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
