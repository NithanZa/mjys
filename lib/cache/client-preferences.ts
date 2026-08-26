"use client";

const BOOK_KEY = "mjys:v1:book-preferences";
const ADMIN_CALENDAR_KEY = "mjys:v1:admin-calendar-preferences";

export interface BookPreferences {
  selectedDate: string | null;
  visibleMonth: string;
  instructorId: string;
  classType: string;
  intensity: string;
  onlyAvailable: boolean;
}

export interface AdminCalendarPreferences {
  currentDate: string;
  viewMode: "week" | "month";
}

function readSessionValue<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Embedded browsers may disable storage.
  }
}

function isReasonableDate(value: string, maxYears: number): boolean {
  const timestamp = new Date(value).getTime();
  const maxDistance = maxYears * 366 * 24 * 60 * 60 * 1000;
  return (
    Number.isFinite(timestamp) &&
    Math.abs(timestamp - Date.now()) <= maxDistance
  );
}

export function readBookPreferences(): BookPreferences | null {
  const value = readSessionValue<BookPreferences>(BOOK_KEY);
  if (
    !value ||
    !isReasonableDate(value.visibleMonth, 3) ||
    typeof value.instructorId !== "string" ||
    value.instructorId.length > 128 ||
    !["all", "regular", "special"].includes(value.classType) ||
    !["all", "A", "B", "I"].includes(value.intensity) ||
    typeof value.onlyAvailable !== "boolean" ||
    (value.selectedDate !== null &&
      !isReasonableDate(value.selectedDate, 3))
  ) {
    return null;
  }
  return value;
}

export function writeBookPreferences(value: BookPreferences) {
  writeSessionValue(BOOK_KEY, value);
}

export function readAdminCalendarPreferences(): AdminCalendarPreferences | null {
  const value =
    readSessionValue<AdminCalendarPreferences>(ADMIN_CALENDAR_KEY);
  if (
    !value ||
    !["week", "month"].includes(value.viewMode) ||
    !isReasonableDate(value.currentDate, 10)
  ) {
    return null;
  }
  return value;
}

export function writeAdminCalendarPreferences(
  value: AdminCalendarPreferences,
) {
  writeSessionValue(ADMIN_CALENDAR_KEY, value);
}
