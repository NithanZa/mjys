import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth/member-request";
import { isStandaloneMode } from "@/lib/auth/mode";
import { CACHE_TAGS, expireCacheTags } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
        if (isStandaloneMode) {
            return NextResponse.json(
                { member: null },
                { headers: { "Cache-Control": "no-store" } },
            );
        }
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const member =
            auth.method === "line"
                ? await prisma.member.findUnique({
                      where: { lineUserId: auth.lineUserId },
                  })
                : await prisma.member.findUnique({ where: { id: auth.memberId } });
        return NextResponse.json(
            { member },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        console.error("[api-members-me] Error fetching member:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const member =
            auth.method === "line"
                ? await prisma.member.findUnique({
                      where: { lineUserId: auth.lineUserId },
                  })
                : await prisma.member.findUnique({ where: { id: auth.memberId } });

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

        if (isStandaloneMode) {
            const { clearSessionCookie } = await import("@/lib/standalone-auth");
            clearSessionCookie(res);
        }

        return res;
    } catch (error) {
        console.error("[api-members-me] Error deleting member:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
