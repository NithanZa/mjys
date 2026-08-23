import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

const REQUIRED_HEADERS = [
    "date",
    "time",
    "durationMin",
    "name",
    "description",
    "tagline",
    "intensity",
    "isSpecial",
    "instructorName",
    "capacity",
];

const INTENSITIES = ["A", "B", "I"];

export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file || file.size === 0) {
            return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
        }

        const text = await file.text();
        const { data, meta, errors } = Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().replace(/^\uFEFF/, ""),
        });

        if (errors.length > 0) {
            console.error("[api-admin-classes-import-csv] Parse errors:", errors);
        }

        if (!meta.fields || meta.fields.length === 0) {
            return NextResponse.json({ error: "CSV has no headers" }, { status: 400 });
        }

        const missing = REQUIRED_HEADERS.filter((h) => !meta.fields!.includes(h));
        if (missing.length > 0) {
            return NextResponse.json(
                { error: `Missing required columns: ${missing.join(", ")}` },
                { status: 400 },
            );
        }

        const instructors = await prisma.instructor.findMany();
        const instructorMap = new Map(instructors.map((i) => [i.name, i.id]));
        let nextOrder = instructors.reduce((max, i) => Math.max(max, i.order), 0) + 1;

        const slugify = (value: string) =>
            value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "instructor";

        const initialsOf = (value: string) =>
            value
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]!.toUpperCase())
                .join("") || "?";

        const pending: {
            name: string;
            description: string;
            tagline: string;
            intensity: string;
            isSpecial: boolean;
            specialPriceTHB: number | null;
            instructorName: string;
            startsAt: Date;
            durationMin: number;
            capacity: number;
        }[] = [];
        const rowErrors: string[] = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2;

            const name = row.name?.trim();
            const date = row.date?.trim();
            const time = row.time?.trim();
            const durationMin = parseInt(row.durationMin, 10);
            const capacity = parseInt(row.capacity, 10);
            const isSpecial = ["true", "1", "yes"].includes(row.isSpecial?.trim().toLowerCase());
            const intensity = row.intensity?.trim() || "A";
            const instructorName = (row.instructorName ?? "").trim();

            // Parse optional specialPriceTHB
            let specialPriceTHB: number | null = null;
            if (isSpecial) {
                const rawPrice = row.specialPriceTHB?.trim();
                if (!rawPrice) {
                    rowErrors.push(`Row ${rowNum}: specialPriceTHB is required when isSpecial is true`);
                    continue;
                }
                const parsedPrice = parseInt(rawPrice, 10);
                if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
                    rowErrors.push(`Row ${rowNum}: specialPriceTHB must be a positive number when isSpecial is true`);
                    continue;
                }
                specialPriceTHB = parsedPrice;
            }

            if (!name) {
                rowErrors.push(`Row ${rowNum}: name is required`);
                continue;
            }
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                rowErrors.push(`Row ${rowNum}: date must be YYYY-MM-DD`);
                continue;
            }
            if (!time || !/^\d{2}:\d{2}$/.test(time)) {
                rowErrors.push(`Row ${rowNum}: time must be HH:MM`);
                continue;
            }
            const startsAt = new Date(`${date}T${time}:00+07:00`);
            if (Number.isNaN(startsAt.getTime())) {
                rowErrors.push(`Row ${rowNum}: date + time is invalid`);
                continue;
            }
            if (Number.isNaN(durationMin) || durationMin < 15) {
                rowErrors.push(`Row ${rowNum}: durationMin must be a number >= 15`);
                continue;
            }
            if (Number.isNaN(capacity) || capacity < 1) {
                rowErrors.push(`Row ${rowNum}: capacity must be a number >= 1`);
                continue;
            }
            if (!INTENSITIES.includes(intensity)) {
                rowErrors.push(`Row ${rowNum}: intensity must be A (All Level), B (Basic), or I (Intermediate)`);
                continue;
            }

            if (!instructorName) {
                rowErrors.push(`Row ${rowNum}: instructorName is required`);
                continue;
            }

            pending.push({
                name,
                description: row.description?.trim() || "",
                tagline: row.tagline?.trim() || "",
                intensity,
                isSpecial,
                specialPriceTHB,
                instructorName,
                startsAt,
                durationMin,
                capacity,
            });
        }

        if (rowErrors.length > 0) {
            return NextResponse.json(
                { error: "Validation failed", details: rowErrors },
                { status: 400 },
            );
        }

        // Only now that every row is valid do we create any missing instructors
        // (referenced by name but not found) and the class occurrences.
        const newInstructorNames = [...new Set(pending.map((p) => p.instructorName))].filter(
            (n) => !instructorMap.has(n),
        );

        const existingSlugs = new Set(instructors.map((i) => i.slug));
        const uniqueSlug = (base: string) => {
            let slug = base;
            let suffix = 2;
            while (existingSlugs.has(slug)) {
                slug = `${base}-${suffix++}`;
            }
            existingSlugs.add(slug);
            return slug;
        };

        const result = await prisma.$transaction(async (tx) => {
            for (const instructorName of newInstructorNames) {
                const createdInstructor = await tx.instructor.create({
                    data: {
                        slug: uniqueSlug(slugify(instructorName)),
                        name: instructorName,
                        title: "Instructor",
                        bio: "",
                        initials: initialsOf(instructorName),
                        order: nextOrder++,
                    },
                });
                instructorMap.set(instructorName, createdInstructor.id);
            }

            const occurrences = pending.map((p) => ({
                name: p.name,
                description: p.description,
                tagline: p.tagline,
                intensity: p.intensity,
                isSpecial: p.isSpecial,
                specialPriceTHB: p.specialPriceTHB,
                instructorId: instructorMap.get(p.instructorName)!,
                startsAt: p.startsAt,
                durationMin: p.durationMin,
                capacity: p.capacity,
                bookedCount: 0,
            }));

            return tx.classOccurrence.createMany({
                data: occurrences,
                skipDuplicates: false,
            });
        });

        return NextResponse.json({
            success: true,
            importedCount: result.count,
            newInstructors: newInstructorNames,
        });
    } catch (error) {
        console.error("[api-admin-classes-import-csv] Error:", error);
        return NextResponse.json({ error: "Failed to import classes" }, { status: 500 });
    }
}
