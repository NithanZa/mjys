"use client";

import { useLiff } from "@/lib/liff";
import { useCallback, useEffect, useState } from "react";

const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";

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

    const isMock = isStandalone ? false : status !== "ready" || !isLoggedIn || !liff;

    const fetchHistory = useCallback(async () => {
        if (isMock) {
            setHistory([]);
            setLoading(false);
            return;
        }

        try {
            let data: any;
            if (isStandalone) {
                const res = await fetch("/api/members/me/history");
                if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
                data = await res.json();
            } else {
                if (!liff) {
                    setError("LIFF not initialized");
                    setLoading(false);
                    return;
                }
                const token = liff.getIDToken();
                if (!token) {
                    setError("No LINE ID token available");
                    setLoading(false);
                    return;
                }
                const res = await fetch("/api/members/me/history", {
                    headers: { Authorization: `Bearer ${token}` },
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
    }, [isMock, liff]);

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
