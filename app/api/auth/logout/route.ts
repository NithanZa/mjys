import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/standalone-auth";

export async function POST(request: NextRequest) {
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE_NAME, "", {
        path: "/",
        maxAge: -1,
    });
    return res;
}
