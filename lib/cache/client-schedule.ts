"use client";

import type { OccurrenceView } from "@/lib/api/classes";

const KEY = "mjys:v1:public-schedule";
const TTL_MS = 3 * 60 * 1000;

interface StoredOccurrence extends Omit<OccurrenceView, "startsAt"> {
  startsAt: string;
}

interface ScheduleSnapshot {
  from: string;
  to: string;
  fetchedAt: number;
  occurrences: StoredOccurrence[];
}

function isStoredOccurrence(value: unknown): value is StoredOccurrence {
  if (!value || typeof value !== "object") return false;
  const occurrence = value as Record<string, unknown>;
  const instructor = occurrence.instructor as Record<string, unknown> | undefined;
  return (
    typeof occurrence.id === "string" &&
    typeof occurrence.instructorId === "string" &&
    typeof occurrence.startsAt === "string" &&
    Number.isFinite(new Date(occurrence.startsAt).getTime()) &&
    typeof occurrence.durationMin === "number" &&
    typeof occurrence.capacity === "number" &&
    typeof occurrence.bookedCount === "number" &&
    typeof occurrence.name === "string" &&
    typeof occurrence.description === "string" &&
    typeof occurrence.tagline === "string" &&
    ["A", "B", "I"].includes(String(occurrence.intensity)) &&
    typeof occurrence.isSpecial === "boolean" &&
    typeof occurrence.isCancelled === "boolean" &&
    (occurrence.specialPriceTHB === null ||
      typeof occurrence.specialPriceTHB === "number") &&
    typeof occurrence.slotsLeft === "number" &&
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
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as ScheduleSnapshot;
    if (
      snapshot.from !== from.toISOString() ||
      snapshot.to !== to.toISOString() ||
      !Number.isFinite(snapshot.fetchedAt) ||
      Date.now() - snapshot.fetchedAt > TTL_MS ||
      !Array.isArray(snapshot.occurrences) ||
      !snapshot.occurrences.every(isStoredOccurrence)
    ) {
      return null;
    }
    return snapshot.occurrences.map((occurrence) => ({
      ...occurrence,
      startsAt: new Date(occurrence.startsAt),
    }));
  } catch {
    return null;
  }
}

export function writeScheduleSnapshot(
  from: Date,
  to: Date,
  occurrences: OccurrenceView[],
) {
  if (typeof window === "undefined") return;
  try {
    const snapshot: ScheduleSnapshot = {
      from: from.toISOString(),
      to: to.toISOString(),
      fetchedAt: Date.now(),
      occurrences: occurrences.map((occurrence) => ({
        ...occurrence,
        startsAt: occurrence.startsAt.toISOString(),
      })),
    };
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Device storage is optional.
  }
}

export function clearScheduleSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Device storage is optional.
  }
}
