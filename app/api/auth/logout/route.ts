import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/standalone-auth";

export const dynamic = "force-dynamic";

export async function POST() {
    const res = NextResponse.json(
        { success: true },
        { headers: { "Cache-Control": "no-store" } },
    );
    clearSessionCookie(res);
    return res;
}
