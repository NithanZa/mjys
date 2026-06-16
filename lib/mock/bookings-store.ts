"use client";

import { useLiff } from "@/lib/liff";
import { getOccurrence, type OccurrenceView } from "@/lib/mock/schedule";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "mjys.bookings.v1";
const CHANGE_EVENT = "mjys:bookings-changed";

export interface MockBooking {
    occurrenceId: string;
    bookedAt: string;
}

// ---- snapshot caching for local storage fallback ----
let cachedRaw: string | null | undefined = undefined;
let cachedList: MockBooking[] = [];

function readSnapshot(): MockBooking[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    try {
        cachedList = raw ? (JSON.parse(raw) as MockBooking[]) : [];
    } catch {
        cachedList = [];
    }
    return cachedList;
}

function writeSnapshot(list: MockBooking[]) {
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

const SERVER_SNAPSHOT: MockBooking[] = [];
const getServerSnapshot = (): MockBooking[] => SERVER_SNAPSHOT;

export interface UseBookingsResult {
    bookings: MockBooking[];
    loading: boolean;
    isBooked: (occurrenceId: string) => boolean;
    book: (occurrenceId: string) => Promise<void>;
    cancel: (occurrenceId: string) => Promise<void>;
    toggle: (occurrenceId: string) => Promise<boolean>;
}

export function useBookings(): UseBookingsResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [realBookings, setRealBookings] = useState<MockBooking[]>([]);
    const [loading, setLoading] = useState(true);

    const isMock = status !== "ready" || !isLoggedIn || !liff;

    const mockBookings = useSyncExternalStore(
        subscribe,
        readSnapshot,
        getServerSnapshot,
    );

    const fetchRealBookings = useCallback(async () => {
        if (isMock) {
            setLoading(false);
            return;
        }

        try {
            const token = liff.getIDToken();
            if (!token) return;

            const res = await fetch("/api/bookings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const mapped: MockBooking[] = data.bookings.map((b: any) => ({
                    occurrenceId: b.classOccurrenceId,
                    bookedAt: b.createdAt,
                }));
                setRealBookings(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch real bookings:", err);
        } finally {
            setLoading(false);
        }
    }, [isMock, liff]);

    useEffect(() => {
        fetchRealBookings();
    }, [fetchRealBookings]);

    const activeBookings = isMock ? mockBookings : realBookings;

    const isBooked = useCallback(
        (occurrenceId: string) => {
            return activeBookings.some((b) => b.occurrenceId === occurrenceId);
        },
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
                const token = liff.getIDToken();
                const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ classOccurrenceId: occurrenceId }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to book");
                }

                await fetchRealBookings();
            } catch (err: any) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        },
        [isMock, liff, fetchRealBookings],
    );

    const cancel = useCallback(
        async (occurrenceId: string) => {
            if (isMock) {
                const current = readSnapshot();
                if (!current.some((b) => b.occurrenceId === occurrenceId)) return;
                writeSnapshot(current.filter((b) => b.occurrenceId !== occurrenceId));
                return;
            }

            setLoading(true);
            try {
                const token = liff.getIDToken();
                const res = await fetch(`/api/bookings?classOccurrenceId=${occurrenceId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to cancel");
                }

                await fetchRealBookings();
            } catch (err: any) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        },
        [isMock, liff, fetchRealBookings],
    );

    const toggle = useCallback(
        async (occurrenceId: string): Promise<boolean> => {
            const has = isBooked(occurrenceId);
            if (has) {
                await cancel(occurrenceId);
                return false;
            } else {
                await book(occurrenceId);
                return true;
            }
        },
        [isBooked, book, cancel],
    );

    return { bookings: activeBookings, loading, isBooked, book, cancel, toggle };
}

/** Returns the soonest upcoming booked occurrence, or null if none. */
export function getNextBooking(): OccurrenceView | null {
    if (typeof window === "undefined") return null;
    const bookings = readSnapshot();
    if (bookings.length === 0) return null;
    const now = Date.now();
    const upcoming = bookings
        .map((b) => getOccurrence(b.occurrenceId))
        .filter(
            (o): o is OccurrenceView =>
                o !== null && o.startsAt.getTime() > now,
        )
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return upcoming[0] ?? null;
}
