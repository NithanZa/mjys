import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/bulk-grant
 * Grants a new dated package lot to multiple members, adding its classes to each balance.
 * Body: { memberIds: string[], packageOfferId: string }
 */
export async function POST(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { memberIds, packageOfferId } = body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "memberIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!packageOfferId) {
      return NextResponse.json(
        { error: "packageOfferId is required" },
        { status: 400 }
      );
    }

    // Verify package offer exists
    const offer = await prisma.packageOffer.findUnique({
      where: { id: packageOfferId },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Package offer not found" },
        { status: 404 }
      );
    }
    if (!Number.isInteger(offer.classCount) || offer.classCount < 1) {
      return NextResponse.json(
        { error: "Package offer must grant at least one class" },
        { status: 409 }
      );
    }

    // Verify all members exist
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
    });

    if (members.length !== memberIds.length) {
      return NextResponse.json(
        { error: "One or more members not found" },
        { status: 404 }
      );
    }

    // Create a separate dated lot for each member; pooled balances are derived from these lots.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + offer.validityDays);

    const packages = await Promise.all(
      memberIds.map((memberId) =>
        prisma.package.create({
          data: {
            memberId,
            packageOfferId,
            classesRemaining: offer.classCount,
            expiresAt,
            status: "ACTIVE",
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully added package classes for ${packages.length} members`,
      grantedCount: packages.length,
    });
  } catch (error) {
    console.error("[api-admin-members-bulk-grant] Error:", error);
    return NextResponse.json(
      { error: "Failed to grant packages" },
      { status: 500 }
    );
  }
}
