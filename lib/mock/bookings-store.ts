"use client";

// FRONTEND-ONLY mock bookings store. localStorage-backed via useSyncExternalStore.
// Replaced in the backend pass by `POST /api/bookings` + `DELETE /api/bookings`
// against the real `Attendance` table (see Phase 3 plan).

import { getOccurrence, type OccurrenceView } from "@/lib/mock/schedule";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mjys.bookings.v1";
const CHANGE_EVENT = "mjys:bookings-changed";

export interface MockBooking {
    occurrenceId: string;
    bookedAt: string;
}

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
    isBooked: (occurrenceId: string) => boolean;
    book: (occurrenceId: string) => void;
    cancel: (occurrenceId: string) => void;
    toggle: (occurrenceId: string) => boolean;
}

/** Returns the soonest upcoming booked occurrence, or null if none. */
export function getNextBooking(): OccurrenceView | null {
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

export function useBookings(): UseBookingsResult {
    const bookings = useSyncExternalStore(
        subscribe,
        readSnapshot,
        getServerSnapshot,
    );

    const isBooked = useCallback(
        (occurrenceId: string) =>
            readSnapshot().some((b) => b.occurrenceId === occurrenceId),
        [],
    );

    const book = useCallback((occurrenceId: string) => {
        const current = readSnapshot();
        if (current.some((b) => b.occurrenceId === occurrenceId)) return;
        writeSnapshot([
            ...current,
            { occurrenceId, bookedAt: new Date().toISOString() },
        ]);
    }, []);

    const cancel = useCallback((occurrenceId: string) => {
        const current = readSnapshot();
        if (!current.some((b) => b.occurrenceId === occurrenceId)) return;
        writeSnapshot(current.filter((b) => b.occurrenceId !== occurrenceId));
    }, []);

    /** Toggle and return the new booked state. */
    const toggle = useCallback((occurrenceId: string): boolean => {
        const current = readSnapshot();
        const has = current.some((b) => b.occurrenceId === occurrenceId);
        if (has) {
            writeSnapshot(
                current.filter((b) => b.occurrenceId !== occurrenceId),
            );
            return false;
        }
        writeSnapshot([
            ...current,
            { occurrenceId, bookedAt: new Date().toISOString() },
        ]);
        return true;
    }, []);

    return { bookings, isBooked, book, cancel, toggle };
}
