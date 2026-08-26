"use client";

import type { OccurrenceView } from "@/lib/api/classes";

const STORAGE_KEY = "mjys:v1:classes:default";
const MAX_AGE_MS = 3 * 60 * 1000;

type StoredOccurrence = Omit<OccurrenceView, "startsAt"> & {
    startsAt: string;
};

interface ScheduleSnapshot {
    version: 1;
    from: string;
    to: string;
    savedAt: number;
    occurrences: StoredOccurrence[];
}

function isStoredOccurrence(value: unknown): value is StoredOccurrence {
    if (!value || typeof value !== "object") return false;
    const occurrence = value as Record<string, unknown>;
    const instructor = occurrence.instructor as
        | Record<string, unknown>
        | undefined;

    return (
        typeof occurrence.id === "string" &&
        occurrence.id.length > 0 &&
        typeof occurrence.instructorId === "string" &&
        typeof occurrence.startsAt === "string" &&
        !Number.isNaN(new Date(occurrence.startsAt).getTime()) &&
        typeof occurrence.name === "string" &&
        ["A", "B", "I"].includes(String(occurrence.intensity)) &&
        typeof occurrence.durationMin === "number" &&
        Number.isFinite(occurrence.durationMin) &&
        typeof occurrence.capacity === "number" &&
        Number.isFinite(occurrence.capacity) &&
        typeof occurrence.bookedCount === "number" &&
        Number.isFinite(occurrence.bookedCount) &&
        typeof occurrence.slotsLeft === "number" &&
        Number.isFinite(occurrence.slotsLeft) &&
        typeof occurrence.isSpecial === "boolean" &&
        typeof occurrence.isCancelled === "boolean" &&
        !!instructor &&
        typeof instructor.id === "string" &&
        typeof instructor.name === "string"
    );
}

export function readScheduleSnapshot(
    from: Date,
    to: Date,
): OccurrenceView[] | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const snapshot = JSON.parse(raw) as ScheduleSnapshot | null;
        const matchesRange =
            snapshot !== null &&
            snapshot.version === 1 &&
            snapshot.from === from.toISOString() &&
            snapshot.to === to.toISOString();
        const isFresh =
            snapshot !== null &&
            Number.isFinite(snapshot.savedAt) &&
            Date.now() >= snapshot.savedAt &&
            Date.now() - snapshot.savedAt <= MAX_AGE_MS;

        if (
            !matchesRange ||
            !isFresh ||
            !snapshot ||
            !Array.isArray(snapshot.occurrences) ||
            !snapshot.occurrences.every(isStoredOccurrence)
        ) {
            clearScheduleSnapshot();
            return null;
        }

        return snapshot.occurrences.map((occurrence) => ({
            ...occurrence,
            startsAt: new Date(occurrence.startsAt),
        }));
    } catch {
        clearScheduleSnapshot();
        return null;
    }
}

export function writeScheduleSnapshot(
    from: Date,
    to: Date,
    occurrences: OccurrenceView[],
) {
    if (typeof window === "undefined") return;

    const snapshot: ScheduleSnapshot = {
        version: 1,
        from: from.toISOString(),
        to: to.toISOString(),
        savedAt: Date.now(),
        occurrences: occurrences.map((occurrence) => ({
            ...occurrence,
            startsAt: occurrence.startsAt.toISOString(),
        })),
    };

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
        // Storage can be disabled or full in embedded browsers. Network data
        // remains the source of truth, so failing to persist is harmless.
    }
}

export function clearScheduleSnapshot() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage is optional.
    }
}

