import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members/export?ids=id1,id2,id3
 * Exports member contact info as CSV.
 */
export async function GET(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "ids query parameter is required" },
        { status: 400 }
      );
    }

    const memberIds = idsParam.split(",").filter((id) => id.trim());

    if (memberIds.length === 0) {
      return NextResponse.json(
        { error: "At least one member ID is required" },
        { status: 400 }
      );
    }

    // Fetch members
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        level: true,
        classesAttended: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No members found" },
        { status: 404 }
      );
    }

    // Generate CSV
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Level",
      "Classes Attended",
      "Registered Date",
    ];

    const rows = members.map((member) => [
      `"${member.displayName.replace(/"/g, '""')}"`, // Escape quotes in names
      `"${member.email}"`,
      `"${member.phone}"`,
      member.level,
      member.classesAttended,
      new Date(member.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    // Return as CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="members-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("[api-admin-members-export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export members" },
      { status: 500 }
    );
  }
}
