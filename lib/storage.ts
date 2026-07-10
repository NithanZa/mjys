import { supabase } from "@/lib/supabase";

/**
 * Storage bucket for member payment-proof slip uploads.
 * The bucket is private — object paths are stored in `PendingPurchase.proofImageUrl`,
 * and short-lived signed URLs are generated on read (see `getSignedSlipUrl`).
 */
export const SLIP_BUCKET = "slips";

/**
 * Normalizes a stored `proofImageUrl` value into a bare object path within the
 * `slips` bucket. Handles both the new format (bare path, e.g. "slip_123.jpg")
 * and the legacy format (a full public URL containing "/slips/<path>") so that
 * historical rows created before the bucket was made private keep working.
 */
export function extractSlipPath(proofImageUrl: string): string {
    const marker = "/slips/";
    const idx = proofImageUrl.indexOf(marker);
    if (idx === -1) return proofImageUrl;
    return proofImageUrl.slice(idx + marker.length);
}

/**
 * Resolves a stored `proofImageUrl` value to a short-lived signed URL for display.
 * Returns null if signing fails (e.g. the object no longer exists).
 */
export async function getSignedSlipUrl(
    proofImageUrl: string,
    expiresInSeconds = 60 * 60,
): Promise<string | null> {
    const path = extractSlipPath(proofImageUrl);
    const { data, error } = await supabase.storage
        .from(SLIP_BUCKET)
        .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
        console.error("[lib-storage] Failed to create signed slip URL:", error);
        return null;
    }
    return data.signedUrl;
}
