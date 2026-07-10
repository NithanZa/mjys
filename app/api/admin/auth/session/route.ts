import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get("mjys_admin_session");
    
    if (!sessionCookie) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
        const secretString = process.env.QR_SIGNING_SECRET;
        if (!secretString) {
            console.error("[api-admin-session] QR_SIGNING_SECRET is not configured");
            return NextResponse.json({ authenticated: false }, { status: 500 });
        }
        const secret = new TextEncoder().encode(secretString);
        
        await jwtVerify(sessionCookie.value, secret, {
            algorithms: ["HS256"],
        });

        return NextResponse.json({ authenticated: true });
    } catch (error) {
        console.error("[api-admin-session] Token validation failed:", error);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
