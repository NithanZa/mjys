import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedMember } from "@/lib/auth/member-request";
import { encodeMemberPassSecure } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const result = await resolveAuthenticatedMember(request);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    try {
        const token = await encodeMemberPassSecure(result.member.id);
        return NextResponse.json({ token });
    } catch (error) {
        console.error("[api-members-qr] Error generating QR token:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
