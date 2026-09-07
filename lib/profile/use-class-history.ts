"use client";

import { isStandaloneMode } from "@/lib/auth/mode";
import { getLiffAuthHeaders, useLiff } from "@/lib/liff";
import { useCallback, useEffect, useState } from "react";

export type ActivityStatus = "ATTENDED" | "BOOKED" | "CANCELLED" | "NO_SHOW";

export interface ActivityItem {
    id: string;
    name: string;
    description: string;
    tagline: string;
    intensity: string;
    isSpecial: boolean;
    durationMin: number;
    instructor: {
        id: string;
        slug: string;
        name: string;
        title: string;
        bio: string;
        photoUrl: string | null;
        initials: string;
        order: number;
    };
    occurredAt: Date;
    status: ActivityStatus;
}

export interface UseClassHistoryResult {
    history: ActivityItem[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useClassHistory(): UseClassHistoryResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [history, setHistory] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!isStandaloneMode && (status !== "ready" || !isLoggedIn || !liff)) {
            setHistory([]);
            setError(null);
            setLoading(false);
            return;
        }

        try {
            let data: any;
            if (isStandaloneMode) {
                const res = await fetch("/api/members/me/history");
                if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
                data = await res.json();
            } else {
                const res = await fetch("/api/members/me/history", {
                    headers: getLiffAuthHeaders(liff),
                });
                if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
                data = await res.json();
            }

            const mapped = data.history.map((item: any) => ({
                ...item,
                occurredAt: new Date(item.occurredAt),
            }));

            setHistory(mapped);
            setError(null);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, liff, status]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return {
        history,
        loading,
        error,
        refresh: fetchHistory,
    };
}
