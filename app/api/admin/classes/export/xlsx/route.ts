import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import ExcelJS from "exceljs";
import { readFile } from "fs/promises";
import path from "path";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

// Brand palette (mirrors app/globals.css @theme tokens)
const BRAND = {
    primary900: "5C2F15",
    primary700: "B25F2D",
    primary600: "DC7A3D",
    primary500: "F29252",
    primary100: "FBE8D0",
    primary50: "FCF6EA",
    accent700: "4F6B41",
    accent500: "7C9A6B",
    accent100: "E3ECDD",
    accent50: "F1F5EE",
    ink: "2A1C14",
    text2: "5F5148",
    line: "F7C9A3",
    white: "FFFFFF",
    successFg: "4F8A5B",
    successBg: "E8F2EA",
    warningFg: "C98A1F",
    warningBg: "FBEDD0",
    errorFg: "B33A2A",
    errorBg: "F8DDD7",
    infoFg: "3D6D8F",
    infoBg: "E1EDF4",
} as const;

const STUDIO_TZ = "Asia/Bangkok";

const HEADERS = [
    { header: "Time", key: "time", width: 20 },
    { header: "Class", key: "name", width: 30 },
    { header: "Tagline", key: "tagline", width: 32 },
    { header: "Intensity", key: "intensity", width: 14 },
    { header: "Type", key: "type", width: 14 },
    { header: "Instructor", key: "instructor", width: 20 },
    { header: "Duration", key: "duration", width: 12 },
    { header: "Booked / Cap", key: "booked", width: 14 },
    { header: "Fill Rate", key: "fillRate", width: 12 },
];

function intensityColors(intensity: string) {
    switch (intensity) {
        case "B":
            return { fg: BRAND.successFg, bg: BRAND.successBg };
        case "I":
            return { fg: BRAND.errorFg, bg: BRAND.errorBg };
        default:
            return { fg: BRAND.infoFg, bg: BRAND.infoBg };
    }
}

export async function GET(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    try {
        const where: any = { isCancelled: false };
        if (startStr && endStr) {
            where.startsAt = {
                gte: new Date(startStr),
                lte: new Date(endStr),
            };
        }

        const occurrences = await prisma.classOccurrence.findMany({
            where,
            include: { instructor: true },
            orderBy: { startsAt: "asc" },
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "MiTR Journey Yoga Studio";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Class Schedule", {
            views: [{ showGridLines: false, state: "frozen", ySplit: 6 }],
            pageSetup: { orientation: "landscape", fitToPage: true },
        });

        const colCount = HEADERS.length;
        const lastColLetter = sheet.getColumn(colCount).letter;

        // ---- Row 1-2: Brand banner ----
        sheet.mergeCells(`A1:${lastColLetter}1`);
        const titleCell = sheet.getCell("A1");
        titleCell.value = "🧘  MiTR JOURNEY YOGA STUDIO";
        titleCell.font = { name: "Calibri", size: 22, bold: true, color: { argb: "FF" + BRAND.white } };
        titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
        sheet.getRow(1).height = 40;

        sheet.mergeCells(`A2:${lastColLetter}2`);
        const subtitleCell = sheet.getCell("A2");
        const rangeLabel =
            startStr && endStr
                ? `${format(toZonedTime(new Date(startStr), STUDIO_TZ), "d MMM yyyy")} — ${format(toZonedTime(new Date(endStr), STUDIO_TZ), "d MMM yyyy")}`
                : "Full Schedule";
        subtitleCell.value = `✨ Class Schedule Export  ·  ${rangeLabel}`;
        subtitleCell.font = { name: "Calibri", size: 12, italic: true, color: { argb: "FF" + BRAND.white } };
        subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
        sheet.getRow(2).height = 22;

        for (const rowNum of [1, 2]) {
            const row = sheet.getRow(rowNum);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF" + (rowNum === 1 ? BRAND.primary700 : BRAND.primary600) },
                };
            });
        }

        // ---- Row 3: spacer ----
        sheet.getRow(3).height = 6;

        // ---- Row 4: stat summary ----
        const totalBooked = occurrences.reduce((s, o) => s + o.bookedCount, 0);
        const totalCapacity = occurrences.reduce((s, o) => s + o.capacity, 0);
        const specialCount = occurrences.filter((o) => o.isSpecial).length;

        sheet.mergeCells(`A4:${lastColLetter}4`);
        const statCell = sheet.getCell("A4");
        statCell.value = `📅 ${occurrences.length} Sessions   ·   👥 ${totalBooked}/${totalCapacity} Booked   ·   ✨ ${specialCount} Special Workshops`;
        statCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF" + BRAND.accent700 } };
        statCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
        statCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.accent100 } };
        sheet.getRow(4).height = 24;

        // ---- Row 5: spacer ----
        sheet.getRow(5).height = 4;

        // ---- Row 6: column headers ----
        const headerRow = sheet.getRow(6);
        HEADERS.forEach((h, i) => {
            sheet.getColumn(i + 1).width = h.width;
            const cell = headerRow.getCell(i + 1);
            cell.value = h.header;
            cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF" + BRAND.white } };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.primary900 } };
            cell.border = {
                top: { style: "thin", color: { argb: "FF" + BRAND.primary900 } },
                bottom: { style: "medium", color: { argb: "FF" + BRAND.primary900 } },
                left: { style: "thin", color: { argb: "FF" + BRAND.primary900 } },
                right: { style: "thin", color: { argb: "FF" + BRAND.primary900 } },
            };
        });
        headerRow.height = 24;
        sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: colCount } };

        // ---- Data rows ----
        occurrences.forEach((occ, idx) => {
            const rowNum = 7 + idx;
            const zoned = toZonedTime(occ.startsAt, STUDIO_TZ);
            const fillRate = occ.capacity > 0 ? occ.bookedCount / occ.capacity : 0;
            const isFull = occ.bookedCount >= occ.capacity;

            const row = sheet.getRow(rowNum);
            row.getCell(1).value = format(zoned, "EEE d MMM · HH:mm");
            row.getCell(2).value = occ.name;
            row.getCell(3).value = occ.tagline;
            row.getCell(4).value = occ.intensity;
            row.getCell(5).value = occ.isSpecial
                ? (occ.specialPriceTHB ? `✨ Special · ฿${occ.specialPriceTHB}` : "✨ Special")
                : "Regular";
            row.getCell(6).value = occ.instructor.name;
            row.getCell(7).value = `${occ.durationMin} min`;
            row.getCell(8).value = `${occ.bookedCount} / ${occ.capacity}`;
            row.getCell(9).value = fillRate;

            const isBanded = idx % 2 === 1;
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { name: "Calibri", size: 10.5, color: { argb: "FF" + BRAND.ink } };
                cell.alignment = { vertical: "middle", horizontal: "left" };
                cell.border = {
                    bottom: { style: "hair", color: { argb: "FF" + BRAND.line } },
                };
                if (isBanded) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.primary50 } };
                }
            });

            // Class name bold + special highlight
            const nameCell = row.getCell(2);
            nameCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF" + BRAND.ink } };
            if (occ.isSpecial) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.accent50 } };
                });
                nameCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF" + BRAND.accent700 } };
            }

            // Intensity badge coloring
            const intensityCell = row.getCell(4);
            const { fg, bg } = intensityColors(occ.intensity);
            intensityCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF" + fg } };
            intensityCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bg } };
            intensityCell.alignment = { vertical: "middle", horizontal: "center" };

            // Type badge
            const typeCell = row.getCell(5);
            typeCell.alignment = { vertical: "middle", horizontal: "center" };
            if (occ.isSpecial) {
                typeCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF" + BRAND.accent700 } };
            }

            // Duration + booked centered
            row.getCell(7).alignment = { vertical: "middle", horizontal: "center" };
            const bookedCell = row.getCell(8);
            bookedCell.alignment = { vertical: "middle", horizontal: "center" };
            bookedCell.font = {
                name: "Calibri",
                size: 10.5,
                bold: true,
                color: { argb: "FF" + (isFull ? BRAND.errorFg : BRAND.ink) },
            };

            // Fill rate as a percentage bar via data bar-like color fill + number format
            const fillCell = row.getCell(9);
            fillCell.numFmt = "0%";
            fillCell.alignment = { vertical: "middle", horizontal: "center" };
            fillCell.font = {
                name: "Calibri",
                size: 10.5,
                bold: true,
                color: {
                    argb:
                        "FF" +
                        (fillRate >= 1 ? BRAND.errorFg : fillRate >= 0.7 ? BRAND.warningFg : BRAND.successFg),
                },
            };
        });

        // Conditional formatting: data bar on the Fill Rate column
        if (occurrences.length > 0) {
            sheet.addConditionalFormatting({
                ref: `I7:I${6 + occurrences.length}`,
                rules: [
                    {
                        type: "dataBar",
                        cfvo: [{ type: "num", value: "0" }, { type: "num", value: "1" }],
                        color: { argb: "FF" + BRAND.primary500 },
                        priority: 1,
                    } as any,
                ],
            });
        }

        // Outer border around the whole table
        const tableLastRow = 6 + Math.max(occurrences.length, 1);
        for (let r = 6; r <= tableLastRow; r++) {
            const firstCell = sheet.getCell(r, 1);
            const lastCell = sheet.getCell(r, colCount);
            firstCell.border = { ...firstCell.border, left: { style: "medium", color: { argb: "FF" + BRAND.primary700 } } };
            lastCell.border = { ...lastCell.border, right: { style: "medium", color: { argb: "FF" + BRAND.primary700 } } };
        }
        for (let c = 1; c <= colCount; c++) {
            const bottomCell = sheet.getCell(tableLastRow, c);
            bottomCell.border = { ...bottomCell.border, bottom: { style: "medium", color: { argb: "FF" + BRAND.primary700 } } };
        }

        if (occurrences.length === 0) {
            sheet.mergeCells(`A7:${lastColLetter}7`);
            const emptyCell = sheet.getCell("A7");
            emptyCell.value = "No classes scheduled in this range.";
            emptyCell.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF" + BRAND.text2 } };
            emptyCell.alignment = { vertical: "middle", horizontal: "center" };
            sheet.getRow(7).height = 28;
        }

        // ---- Studio logo, embedded top-right of the banner ----
        try {
            const logoPath = path.join(process.cwd(), "public", "mitr logo.jpg");
            const logoBuffer = await readFile(logoPath);
            const imageId = workbook.addImage({ buffer: logoBuffer as any, extension: "jpeg" });
            sheet.addImage(imageId, {
                tl: { col: colCount - 1.4, row: 0.05 },
                ext: { width: 60, height: 60 },
            });
        } catch {
            // Logo is a nice-to-have — skip silently if the asset is unavailable.
        }

        const arrayBuffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(arrayBuffer as any, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="mitr-class-schedule-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("[api-admin-classes-export-xlsx] Error:", error);
        return NextResponse.json({ error: "Failed to export classes" }, { status: 500 });
    }
}
