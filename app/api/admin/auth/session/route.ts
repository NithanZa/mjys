import { NextRequest, NextResponse } from "next/server";
import { isAdminSessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get("mjys_admin_session");
    
    if (!sessionCookie) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const secretString = process.env.QR_SIGNING_SECRET;
    if (!secretString) {
        console.error("[api-admin-session] QR_SIGNING_SECRET is not configured");
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }

    if (await isAdminSessionToken(sessionCookie.value, secretString)) {
        return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
}
