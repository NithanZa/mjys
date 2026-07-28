// Client-side data access for real (Prisma-backed) class occurrences.
// Replaces `lib/mock/schedule.ts`'s hardcoded June-2026-only generator so
// admin-imported classes (any date) show up on the client immediately.

import type { Instructor } from "@/lib/api/instructors";

export interface ClassOccurrenceBase {
    id: string;
    instructorId: string;
    durationMin: number;
    capacity: number;
    bookedCount: number;
    name: string;
    description: string;
    tagline: string;
    intensity: "A" | "B" | "I";
    isSpecial: boolean;
    isCancelled: boolean;
}

/** Occurrence shape used throughout the client app: `startsAt` is a real `Date`. */
export interface OccurrenceView extends ClassOccurrenceBase {
    startsAt: Date;
    instructor: Instructor;
    slotsLeft: number;
}

/** Wire shape returned by `/api/classes`: `startsAt` is an ISO string. */
interface OccurrenceWire extends ClassOccurrenceBase {
    startsAt: string;
    instructor: Instructor;
    slotsLeft: number;
}

function toOccurrenceView(raw: OccurrenceWire): OccurrenceView {
    return {
        ...raw,
        startsAt: new Date(raw.startsAt),
    };
}

/** Fetch all occurrences in `[from, to]`, ordered by start time. */
export async function fetchClasses(from: Date, to: Date): Promise<OccurrenceView[]> {
    const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
    });
    const res = await fetch(`/api/classes?${params.toString()}`);
    if (!res.ok) {
        throw new Error("Failed to fetch classes");
    }
    const data = await res.json();
    return (data.occurrences as OccurrenceWire[]).map(toOccurrenceView);
}

/** Fetch a single occurrence by id, or `null` if not found. */
export async function fetchOccurrence(occurrenceId: string): Promise<OccurrenceView | null> {
    const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceId }),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error("Failed to fetch class occurrence");
    }
    const data = await res.json();
    return toOccurrenceView(data.occurrence as OccurrenceWire);
}
