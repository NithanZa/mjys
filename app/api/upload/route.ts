import { NextRequest, NextResponse } from "next/server";
import { verifyLineIdToken } from "@/lib/line/verify-id-token";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
};

/**
 * POST /api/upload
 * Receives a multipart/form-data image (field: "file"), validates type/size,
 * writes it to /public/uploads/slips, and returns the public URL.
 * Authenticated via the member's LINE ID token.
 */
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
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }

        const ext = ALLOWED_TYPES[file.type];
        if (!ext) {
            return NextResponse.json(
                { error: "Unsupported file type. Upload a JPG, PNG, or WEBP image." },
                { status: 415 },
            );
        }

        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5 MB." },
                { status: 413 },
            );
        }

        const bytes = Buffer.from(await file.arrayBuffer());
        const fileName = `slip_${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), bytes);

        const url = `/uploads/slips/${fileName}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("[api-upload] Error saving file:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
