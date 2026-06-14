// Studio is in Bangkok. All schedule logic is computed in this TZ so a class
// at 09:00 Bangkok always reads as 09:00 regardless of where the LIFF app runs.

import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const STUDIO_TZ = "Asia/Bangkok";

/** Today, anchored to the studio TZ midnight, returned as a UTC `Date`. */
export function studioToday(): Date {
  const nowInTz = toZonedTime(new Date(), STUDIO_TZ);
  const startInTz = startOfDay(nowInTz);
  return fromZonedTime(startInTz, STUDIO_TZ);
}

/** Generate `count` consecutive days starting at `start` (inclusive), at studio midnight. */
export function generateDateStrip(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** Format helpers — all use the studio TZ so the label matches the schedule. */
export function formatMonthYear(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "MMMM yyyy");
}

export function formatWeekday(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "EEE");
}

export function formatDayNumber(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "d");
}

export function formatTime(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "HH:mm");
}

export function formatDateLong(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "EEEE, d MMMM yyyy");
}

/** True if both dates fall on the same studio-local calendar day. */
export function isSameStudioDay(a: Date, b: Date): boolean {
  return isSameDay(toZonedTime(a, STUDIO_TZ), toZonedTime(b, STUDIO_TZ));
}

/** Whole calendar days between two studio-local dates (b - a). */
export function studioDaysBetween(a: Date, b: Date): number {
  return differenceInCalendarDays(
    toZonedTime(b, STUDIO_TZ),
    toZonedTime(a, STUDIO_TZ),
  );
}
