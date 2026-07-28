"use client";

// Real bookings access. Talks to `/api/bookings`, which enforces auth
// (LINE ID token in LIFF mode, signed HttpOnly cookie in standalone mode),
// capacity limits, duplicate checks and package decrement server-side.
//
// A localStorage fallback is kept ONLY for local development outside LINE
// with standalone mode off, where no member session can exist.

import { useLiff } from "@/lib/liff";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "mjys.bookings.v1";
const CHANGE_EVENT = "mjys:bookings-changed";

/** True when the app runs as a regular web app (cookie auth, no LINE). */
const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";

export interface Booking {
    occurrenceId: string;
    bookedAt: string;
}

/** Attendance row shape returned by `GET /api/bookings`. */
interface AttendanceWire {
    classOccurrenceId: string;
    createdAt: string;
}

// ---- snapshot caching for the dev localStorage fallback ----
let cachedRaw: string | null | undefined = undefined;
let cachedList: Booking[] = [];

function readSnapshot(): Booking[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    try {
        cachedList = raw ? (JSON.parse(raw) as Booking[]) : [];
    } catch {
        cachedList = [];
    }
    return cachedList;
}

function writeSnapshot(list: Booking[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener("storage", callback);
    return () => {
        window.removeEventListener(CHANGE_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
}

const SERVER_SNAPSHOT: Booking[] = [];
const getServerSnapshot = (): Booking[] => SERVER_SNAPSHOT;

export interface UseBookingsResult {
    bookings: Booking[];
    loading: boolean;
    error: string | null;
    isBooked: (occurrenceId: string) => boolean;
    book: (occurrenceId: string) => Promise<void>;
    cancel: (occurrenceId: string) => Promise<void>;
    toggle: (occurrenceId: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

export function useBookings(): UseBookingsResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [realBookings, setRealBookings] = useState<Booking[]>([]);
    const [error, setError] = useState<string | null>(null);

    // In standalone mode auth is cookie-based, so always use the real API.
    // In LIFF mode fall back to local storage only while LIFF isn't usable.
    const isMock = isStandalone
        ? false
        : status !== "ready" || !isLoggedIn || !liff;

    const [loading, setLoading] = useState(!isMock);

    const mockBookings = useSyncExternalStore(
        subscribe,
        readSnapshot,
        getServerSnapshot,
    );

    /** Auth headers for the current mode (cookie mode needs none). */
    const authHeaders = useCallback((): Record<string, string> => {
        if (isStandalone) return {};
        const token = liff?.getIDToken();
        if (!token) {
            throw new Error(
                "LINE ID Token is missing. Enable the 'openid' scope for this LIFF channel, then log out and back in.",
            );
        }
        return { Authorization: `Bearer ${token}` };
    }, [liff]);

    const fetchRealBookings = useCallback(async () => {
        if (isMock) return;

        try {
            const res = await fetch("/api/bookings", {
                headers: authHeaders(),
            });
            if (!res.ok) {
                // 404 = member not registered yet; treat as "no bookings".
                if (res.status === 404) {
                    setRealBookings([]);
                    return;
                }
                throw new Error("Failed to fetch bookings");
            }
            const data = await res.json();
            setRealBookings(
                (data.bookings as AttendanceWire[]).map((b) => ({
                    occurrenceId: b.classOccurrenceId,
                    bookedAt: b.createdAt,
                })),
            );
            setError(null);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
            setError(
                err instanceof Error ? err.message : "Failed to fetch bookings",
            );
        } finally {
            setLoading(false);
        }
    }, [isMock, authHeaders]);

    useEffect(() => {
        fetchRealBookings();
    }, [fetchRealBookings]);

    const activeBookings = isMock ? mockBookings : realBookings;

    const isBooked = useCallback(
        (occurrenceId: string) =>
            activeBookings.some((b) => b.occurrenceId === occurrenceId),
        [activeBookings],
    );

    const book = useCallback(
        async (occurrenceId: string) => {
            if (isMock) {
                const current = readSnapshot();
                if (current.some((b) => b.occurrenceId === occurrenceId)) return;
                writeSnapshot([
                    ...current,
                    { occurrenceId, bookedAt: new Date().toISOString() },
                ]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify({ classOccurrenceId: occurrenceId }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to book");
                }

                await fetchRealBookings();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to book";
                setError(message);
                alert(message);
            } finally {
                setLoading(false);
            }
        },
        [isMock, authHeaders, fetchRealBookings],
    );

    const cancel = useCallback(
        async (occurrenceId: string) => {
            if (isMock) {
                const current = readSnapshot();
                if (!current.some((b) => b.occurrenceId === occurrenceId)) return;
                writeSnapshot(
                    current.filter((b) => b.occurrenceId !== occurrenceId),
                );
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(
                    `/api/bookings?classOccurrenceId=${encodeURIComponent(occurrenceId)}`,
                    {
                        method: "DELETE",
                        headers: authHeaders(),
                    },
                );

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to cancel");
                }

                await fetchRealBookings();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to cancel";
                setError(message);
                alert(message);
            } finally {
                setLoading(false);
            }
        },
        [isMock, authHeaders, fetchRealBookings],
    );

    const toggle = useCallback(
        async (occurrenceId: string): Promise<boolean> => {
            if (isBooked(occurrenceId)) {
                await cancel(occurrenceId);
                return false;
            }
            await book(occurrenceId);
            return true;
        },
        [isBooked, book, cancel],
    );

    return {
        bookings: activeBookings,
        loading,
        error,
        isBooked,
        book,
        cancel,
        toggle,
        refresh: fetchRealBookings,
    };
}
