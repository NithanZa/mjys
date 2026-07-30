import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { AVATAR_BUCKET, getAvatarPublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

/**
 * POST /api/admin/staff/upload-avatar
 * Accepts multipart/form-data (field: "file"), validates type/size,
 * uploads to the public `avatars` Supabase Storage bucket, and returns
 * the public URL of the uploaded image.
 */
export async function POST(request: NextRequest) {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

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
        const fileName = `avatar_${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from(AVATAR_BUCKET)
            .upload(fileName, bytes, {
                contentType: file.type,
                cacheControl: "31536000",
                upsert: false,
            });

        if (uploadError) {
            console.error("[api-admin-staff-upload] Supabase upload failed:", uploadError);
            return NextResponse.json(
                { error: "Upload to cloud storage failed. Ensure the 'avatars' bucket exists and is public." },
                { status: 500 },
            );
        }

        const url = getAvatarPublicUrl(fileName);
        return NextResponse.json({ url });
    } catch (error) {
        console.error("[api-admin-staff-upload] Error saving file:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
