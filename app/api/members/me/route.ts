import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { parseSessionCookie } from "@/lib/standalone-auth";
import { CACHE_TAGS, expireCacheTags } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
        }
        try {
            const member = await prisma.member.findUnique({
                where: { lineUserId: lineClaims.lineUserId },
            });
            return NextResponse.json({ member });
        } catch (error) {
            console.error("[api-members-me] Error fetching member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    }

    if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        const memberId = parseSessionCookie(request);
        if (!memberId) {
            return NextResponse.json({ member: null });
        }
        try {
            const member = await prisma.member.findUnique({ where: { id: memberId } });
            return NextResponse.json({ member });
        } catch (error) {
            console.error("[api-members-me] Error fetching standalone member:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
    }

    return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
    );
}

export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");

    let memberId: string | null = null;
    let lineUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const lineClaims = await verifyLineIdToken(idToken);
        if (!lineClaims) {
            return NextResponse.json({ error: "Invalid LINE ID token" }, { status: 401 });
        }
        lineUserId = lineClaims.lineUserId;
    } else if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
        memberId = parseSessionCookie(request);
        if (!memberId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
    } else {
        return NextResponse.json(
            { error: "Missing or invalid authorization header" },
            { status: 401 },
        );
    }

    try {
        const member = await prisma.member.findUnique({
            where: memberId ? { id: memberId } : { lineUserId: lineUserId! },
        });

        if (!member) {
            return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
        }

        // Delete from Supabase Auth if standalone
        if (member.lineUserId.startsWith("sa_")) {
            const supabaseUserId = member.lineUserId.substring(3);
            const { supabase } = await import("@/lib/supabase");
            const { error: authError } = await supabase.auth.admin.deleteUser(supabaseUserId);
            if (authError) {
                console.error("[api-members-me] Error deleting Supabase auth user:", authError);
                // Continue with database deletion anyway to not leave orphaned DB records
            }
        }

        // Delete member from database (cascades automatically to all associated tables)
        await prisma.member.delete({
            where: { id: member.id },
        });
        expireCacheTags(CACHE_TAGS.memberStats, CACHE_TAGS.staffStats);

        const res = NextResponse.json({ success: true, message: "Member and all personal data deleted successfully" });
        
        // If standalone, clear the session cookie
        if (process.env.NEXT_PUBLIC_STANDALONE_MODE === "true") {
            const { SESSION_COOKIE_NAME } = await import("@/lib/standalone-auth");
            res.cookies.set(SESSION_COOKIE_NAME, "", {
                path: "/",
                maxAge: -1,
            });
        }

        return res;
    } catch (error) {
        console.error("[api-members-me] Error deleting member:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
