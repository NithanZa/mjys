import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";
import { verifyAdmin } from "@/lib/admin-auth";
import { addDays } from "date-fns";
import type { Member } from "@/generated/prisma/client";
import { getSignedSlipUrl } from "@/lib/storage";

async function resolveMember(request: NextRequest): Promise<Member | null | { _err: string; _status: number }> {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const lineClaims = await verifyLineIdToken(authHeader.substring(7));
        if (!lineClaims) return { _err: "Invalid LINE ID token", _status: 401 };
        return prisma.member.findUnique({ where: { lineUserId: lineClaims.lineUserId } });
    }
    if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        const memberId = parseSessionCookie(request);
        if (!memberId) return { _err: "Not authenticated", _status: 401 };
        return prisma.member.findUnique({ where: { id: memberId } });
    }
    return { _err: "Missing or invalid authorization header", _status: 401 };
}

function isAuthError(v: unknown): v is { _err: string; _status: number } {
    return typeof v === "object" && v !== null && "_err" in v;
}

export const dynamic = "force-dynamic";

// GET: Retrieve purchases and active packages for the logged-in member
export async function GET(request: NextRequest) {
    try {
        const result = await resolveMember(request);
        if (isAuthError(result)) return NextResponse.json({ error: result._err }, { status: result._status });
        if (!result) return NextResponse.json({ error: "Member not registered" }, { status: 404 });
        const member = result;

        const [pendingPurchases, activePackages] = await Promise.all([
            prisma.pendingPurchase.findMany({
                where: { memberId: member.id },
                include: { offer: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.package.findMany({
                where: { memberId: member.id },
                include: { offer: true },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const pendingPurchasesWithSignedSlips = await Promise.all(
            pendingPurchases.map(async (p) => ({
                ...p,
                proofImageUrl: p.proofImageUrl
                    ? await getSignedSlipUrl(p.proofImageUrl)
                    : null,
            })),
        );

        return NextResponse.json({ pendingPurchases: pendingPurchasesWithSignedSlips, activePackages });
    } catch (error) {
        console.error("[api-purchases-get] Error fetching purchases:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// POST: Create a PENDING purchase for a package offer
export async function POST(request: NextRequest) {
    try {
        const result = await resolveMember(request);
        if (isAuthError(result)) return NextResponse.json({ error: result._err }, { status: result._status });
        if (!result) return NextResponse.json({ error: "Member not registered" }, { status: 404 });
        const member = result;

        const { packageOfferId, proofImageUrl } = await request.json();
        if (!packageOfferId) {
            return NextResponse.json({ error: "packageOfferId is required" }, { status: 400 });
        }

        const offer = await prisma.packageOffer.findUnique({ where: { id: packageOfferId } });
        if (!offer) {
            return NextResponse.json({ error: "Package offer not found" }, { status: 404 });
        }

        const pendingPurchase = await prisma.pendingPurchase.create({
            data: { memberId: member.id, packageOfferId, proofImageUrl: proofImageUrl ?? null, status: "PENDING" },
            include: { offer: true },
        });

        return NextResponse.json({ success: true, pendingPurchase });
    } catch (error) {
        console.error("[api-purchases-post] Error creating purchase:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// PATCH: Approve or Reject a pending purchase (admin only)
export async function PATCH(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

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
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const result = await resolveMember(request);
        if (isAuthError(result)) return NextResponse.json({ error: result._err }, { status: result._status });
        if (!result) return NextResponse.json({ error: "Member not found" }, { status: 404 });
        const member = result;

        await prisma.pendingPurchase.deleteMany({ where: { memberId: member.id } });
        await prisma.package.deleteMany({ where: { memberId: member.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api-purchases-reset] Error resetting packages:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
