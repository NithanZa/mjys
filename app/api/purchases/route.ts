import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

// GET: Retrieve purchases and active packages for the logged-in member
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const member = await prisma.member.findUnique({
            where: { lineUserId: lineClaims.lineUserId },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Member not registered" },
                { status: 404 },
            );
        }

        const pendingPurchases = await prisma.pendingPurchase.findMany({
            where: { memberId: member.id },
            include: { offer: true },
            orderBy: { createdAt: "desc" },
        });

        const activePackages = await prisma.package.findMany({
            where: { memberId: member.id },
            include: { offer: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ pendingPurchases, activePackages });
    } catch (error) {
        console.error("[api-purchases-get] Error fetching purchases:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// POST: Create a PENDING purchase for a package offer
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const { packageOfferId, proofImageUrl } = await request.json();
        if (!packageOfferId) {
            return NextResponse.json(
                { error: "packageOfferId is required" },
                { status: 400 },
            );
        }

        const member = await prisma.member.findUnique({
            where: { lineUserId: lineClaims.lineUserId },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Member not registered" },
                { status: 404 },
            );
        }

        const offer = await prisma.packageOffer.findUnique({
            where: { id: packageOfferId },
        });

        if (!offer) {
            return NextResponse.json(
                { error: "Package offer not found" },
                { status: 404 },
            );
        }

        const pendingPurchase = await prisma.pendingPurchase.create({
            data: {
                memberId: member.id,
                packageOfferId,
                proofImageUrl: proofImageUrl ?? null,
                status: "PENDING",
            },
            include: { offer: true },
        });

        return NextResponse.json({ success: true, pendingPurchase });
    } catch (error) {
        console.error("[api-purchases-post] Error creating purchase:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// PATCH: Approve or Reject a pending purchase (Simulating admin/studio side)
export async function PATCH(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const { purchaseId, status } = await request.json();
        if (!purchaseId || !status || !["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json(
                { error: "purchaseId and valid status are required" },
                { status: 400 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const pending = await tx.pendingPurchase.findUnique({
                where: { id: purchaseId },
                include: { offer: true },
            });

            if (!pending) throw new Error("PURCHASE_NOT_FOUND");
            if (pending.status !== "PENDING") throw new Error("ALREADY_REVIEWED");

            // 1. Update pending purchase status
            const updatedPending = await tx.pendingPurchase.update({
                where: { id: purchaseId },
                data: {
                    status: status,
                    reviewedAt: new Date(),
                },
            });

            // 2. If approved, create active Member Package record
            let memberPackage = null;
            if (status === "APPROVED") {
                const expiresAt = addDays(new Date(), pending.offer.validityDays);
                memberPackage = await tx.package.create({
                    data: {
                        memberId: pending.memberId,
                        packageOfferId: pending.packageOfferId,
                        classesRemaining: pending.offer.classCount,
                        expiresAt: expiresAt,
                        status: "ACTIVE",
                    },
                    include: { offer: true },
                });
            }

            return { pending: updatedPending, package: memberPackage };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error("[api-purchases-patch] Error updating purchase status:", error);
        if (error.message === "PURCHASE_NOT_FOUND") {
            return NextResponse.json({ error: "Purchase record not found." }, { status: 404 });
        }
        if (error.message === "ALREADY_REVIEWED") {
            return NextResponse.json({ error: "This purchase has already been reviewed." }, { status: 409 });
        }
        return NextResponse.json({ error: "Transaction failed." }, { status: 500 });
    }
}
export async function PUT(request: NextRequest) {
    // Dev reset endpoint: Clear all pending purchases and packages to start over
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    const idToken = authHeader.substring(7);
    const lineClaims = await verifyLineIdToken(idToken);
    if (!lineClaims) {
        return NextResponse.json(
            { error: "Invalid LINE ID token" },
            { status: 401 },
        );
    }

    try {
        const member = await prisma.member.findUnique({
            where: { lineUserId: lineClaims.lineUserId },
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        await prisma.pendingPurchase.deleteMany({ where: { memberId: member.id } });
        await prisma.package.deleteMany({ where: { memberId: member.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api-purchases-reset] Error resetting packages:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
