import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { z } from "zod";

const RegistrationSchema = z.object({
    displayName: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/),
    dob: z.string().min(1),
    address: z.string().trim().min(5),
    tocAccepted: z.literal(true),
});

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
        const body = await request.json();
        const parsed = RegistrationSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.format() },
                { status: 400 },
            );
        }

        const { displayName, email, phone, dob, address, tocAccepted } =
            parsed.data;

        // Create the member in the database linked to the verified lineUserId
        const member = await prisma.member.create({
            data: {
                lineUserId: lineClaims.lineUserId,
                displayName,
                email,
                phone,
                dob,
                address,
                tocAccepted,
            },
        });

        return NextResponse.json({ member }, { status: 201 });
    } catch (error: any) {
        console.error("[api-members] Error registering member:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                {
                    error: "This LINE account is already registered as a member.",
                },
                { status: 409 },
            );
        }
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
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
        const body = await request.json();
        // Allow updating only classesAttended, celebratedLevels, or level for admin/dev features
        const updateSchema = z.object({
            classesAttended: z.number().int().nonnegative().optional(),
            celebratedLevels: z.array(z.enum(["CAT", "TIGER", "LEOPARD"])).optional(),
            level: z.enum(["CAT", "TIGER", "LEOPARD"]).optional(),
        });

        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.format() },
                { status: 400 },
            );
        }

        const member = await prisma.member.update({
            where: { lineUserId: lineClaims.lineUserId },
            data: parsed.data,
        });

        return NextResponse.json({ member });
    } catch (error) {
        console.error("[api-members] Error updating member:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
