"use client";

// Real bookings access. Talks to `/api/bookings`, which enforces cookie auth,
// capacity limits, duplicate checks and package decrement server-side.

import { usePurchases } from "@/lib/api/purchases";
import { useMember } from "@/lib/profile/use-member";
import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

export interface Booking {
    occurrenceId: string;
    bookedAt: string;
    isPaidSpecial: boolean;
}

/** Attendance row shape returned by `GET /api/bookings`. */
interface AttendanceWire {
    classOccurrenceId: string;
    createdAt: string;
    isPaidSpecial?: boolean;
}

export interface UseBookingsResult {
    bookings: Booking[];
    loading: boolean;
    error: string | null;
    isBooked: (occurrenceId: string) => boolean;
    isPaidSpecialBooking: (occurrenceId: string) => boolean;
    book: (occurrenceId: string) => Promise<void>;
    cancel: (occurrenceId: string) => Promise<void>;
    toggle: (occurrenceId: string) => Promise<boolean>;
    refresh: () => Promise<void>;
}

const BookingsContext = createContext<UseBookingsResult | null>(null);

function useBookingsState(): UseBookingsResult {
    const { member, loading: memberLoading, requestSignIn } = useMember();
    const { refresh: refreshPurchases } = usePurchases();
    const memberId = member?.id ?? null;
    const [realBookings, setRealBookings] = useState<Booking[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const loadedMemberId = useRef<string | null>(null);
    const currentMemberId = useRef(memberId);
    const requestId = useRef(0);
    currentMemberId.current = memberId;

    const fetchRealBookings = useCallback(async () => {
        const activeRequestId = ++requestId.current;
        const requestedMemberId = memberId;
        const isCurrentRequest = () =>
            activeRequestId === requestId.current &&
            requestedMemberId === currentMemberId.current;

        if (!memberId) {
            setRealBookings([]);
            setLoading(true);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/bookings");
            if (!res.ok) {
                // 404 = member not registered yet; treat as "no bookings".
                if (res.status === 404) {
                    if (isCurrentRequest()) setRealBookings([]);
                    return;
                }
                throw new Error("Failed to fetch bookings");
            }
            const data = await res.json();
            if (!isCurrentRequest()) return;
            setRealBookings(
                (data.bookings as AttendanceWire[]).map((b) => ({
                    occurrenceId: b.classOccurrenceId,
                    bookedAt: b.createdAt,
                    isPaidSpecial: b.isPaidSpecial ?? false,
                })),
            );
            setError(null);
        } catch (err) {
            if (!isCurrentRequest()) return;
            console.error("Failed to fetch bookings:", err);
            setError(
                err instanceof Error ? err.message : "Failed to fetch bookings",
            );
        } finally {
            if (isCurrentRequest()) setLoading(false);
        }
    }, [memberId]);

    useEffect(() => {
        if (!memberId) {
            loadedMemberId.current = null;
            void fetchRealBookings();
            return;
        }
        if (loadedMemberId.current === memberId) return;
        loadedMemberId.current = memberId;
        void fetchRealBookings();
    }, [fetchRealBookings, memberId]);

    const activeBookings = realBookings;

    const isBooked = useCallback(
        (occurrenceId: string) =>
            activeBookings.some((b) => b.occurrenceId === occurrenceId),
        [activeBookings],
    );

    const isPaidSpecialBooking = useCallback(
        (occurrenceId: string) =>
            activeBookings.some(
                (booking) => booking.occurrenceId === occurrenceId && booking.isPaidSpecial,
            ),
        [activeBookings],
    );

    const book = useCallback(
        async (occurrenceId: string) => {
            if (!memberId) {
                requestSignIn();
                return;
            }
            setLoading(true);
            try {
                const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ classOccurrenceId: occurrenceId }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to book");
                }

                await fetchRealBookings();
                await refreshPurchases();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to book";
                setError(message);
                alert(message);
            } finally {
                setLoading(false);
            }
        },
        [fetchRealBookings, memberId, refreshPurchases, requestSignIn],
    );

    const cancel = useCallback(
        async (occurrenceId: string) => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/bookings?classOccurrenceId=${encodeURIComponent(occurrenceId)}`,
                    { method: "DELETE" },
                );

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to cancel");
                }

                await fetchRealBookings();
                await refreshPurchases();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to cancel";
                setError(message);
                alert(message);
            } finally {
                setLoading(false);
            }
        },
        [fetchRealBookings, refreshPurchases],
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
        loading: memberId ? loading : memberLoading,
        error,
        isBooked,
        isPaidSpecialBooking,
        book,
        cancel,
        toggle,
        refresh: fetchRealBookings,
    };
}

export function BookingsProvider({ children }: { children: ReactNode }) {
    const value = useBookingsState();
    return createElement(BookingsContext.Provider, { value }, children);
}

export function useBookings(): UseBookingsResult {
    const value = useContext(BookingsContext);
    if (!value) {
        throw new Error("useBookings must be used within BookingsProvider");
    }
    return value;
}
