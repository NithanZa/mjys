"use client";

// Client-side helper for looking up a member's special-class payment/admission
// status for a specific class occurrence. Talks to the real `/api/purchases`
// endpoint (auth via LINE ID token in LIFF mode, cookie in standalone mode).

import { isStandaloneMode } from "@/lib/auth/mode";
import { getLiffAuthHeaders, useLiff } from "@/lib/liff";
import { useCallback, useEffect, useState } from "react";

export type SpecialAdmissionStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface SpecialAdmission {
    status: SpecialAdmissionStatus;
    rejectionReason: string | null;
    purchaseId: string | null;
}

const NONE_ADMISSION: SpecialAdmission = {
    status: "NONE",
    rejectionReason: null,
    purchaseId: null,
};

const isStandalone = isStandaloneMode;

export interface UseSpecialAdmissionResult {
    admission: SpecialAdmission;
    loading: boolean;
    refresh: () => Promise<void>;
}

/**
 * Returns the current member's payment/admission status for a single special
 * class occurrence: whether they have no request, a pending slip, an
 * approved admission, or a rejected slip (with reason, if any).
 */
export function useSpecialAdmission(occurrenceId: string | null): UseSpecialAdmissionResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [admission, setAdmission] = useState<SpecialAdmission>(NONE_ADMISSION);
    const [loading, setLoading] = useState(true);

    const fetchAdmission = useCallback(async () => {
        if (!occurrenceId || (!isStandalone && (status !== "ready" || !isLoggedIn || !liff))) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (!isStandalone) {
                Object.assign(headers, getLiffAuthHeaders(liff));
            }

            const res = await fetch("/api/purchases", { headers });
            if (!res.ok) {
                setAdmission(NONE_ADMISSION);
                return;
            }

            const data = await res.json();
            const matches = (data.pendingPurchases ?? []).filter(
                (p: any) => p.kind === "SPECIAL_CLASS" && p.classOccurrenceId === occurrenceId,
            );

            // Prefer the most decisive/recent status: APPROVED > PENDING > REJECTED
            const approved = matches.find((p: any) => p.status === "APPROVED");
            const pending = matches.find((p: any) => p.status === "PENDING");
            const rejected = matches
                .filter((p: any) => p.status === "REJECTED")
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            if (approved) {
                setAdmission({ status: "APPROVED", rejectionReason: null, purchaseId: approved.id });
            } else if (pending) {
                setAdmission({ status: "PENDING", rejectionReason: null, purchaseId: pending.id });
            } else if (rejected) {
                setAdmission({
                    status: "REJECTED",
                    rejectionReason: rejected.rejectionReason ?? null,
                    purchaseId: rejected.id,
                });
            } else {
                setAdmission(NONE_ADMISSION);
            }
        } catch (err) {
            console.error("Failed to fetch special-class admission status:", err);
            setAdmission(NONE_ADMISSION);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, liff, occurrenceId, status]);

    useEffect(() => {
        fetchAdmission();
    }, [fetchAdmission]);

    return { admission, loading, refresh: fetchAdmission };
}
