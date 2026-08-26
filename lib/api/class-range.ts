import {
  addMonths,
  addYears,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";

export interface ClassRange {
  from: Date;
  to: Date;
}

/** A stable studio-local key for the month containing `date`. */
export function classMonthKey(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "yyyy-MM");
}

/** Return the exact UTC range for one studio-local calendar month. */
export function classMonthRange(date: Date): ClassRange {
  const localDate = toZonedTime(date, STUDIO_TZ);

  return {
    from: fromZonedTime(startOfMonth(localDate), STUDIO_TZ),
    to: fromZonedTime(endOfMonth(localDate), STUDIO_TZ),
  };
}

/**
 * Keep Book's initial payload small while still showing the current month and
 * two months ahead. The one-day lookback preserves the former date boundary.
 */
export function defaultClassRange(today: Date): ClassRange {
  const localToday = toZonedTime(today, STUDIO_TZ);

  return {
    from: fromZonedTime(startOfDay(subDays(localToday, 1)), STUDIO_TZ),
    to: fromZonedTime(endOfMonth(addMonths(localToday, 2)), STUDIO_TZ),
  };
}

/** Month keys fully covered by `defaultClassRange`. */
export function defaultClassMonthKeys(today: Date): string[] {
  const localToday = toZonedTime(today, STUDIO_TZ);
  const currentMonth = startOfMonth(localToday);

  return Array.from({ length: 3 }, (_, offset) =>
    format(addMonths(currentMonth, offset), "yyyy-MM"),
  );
}

/** Keep the two-year navigation horizon without loading it all up front. */
export function classNavigationRange(today: Date): ClassRange {
  const localToday = toZonedTime(today, STUDIO_TZ);

  return {
    from: fromZonedTime(startOfDay(subDays(localToday, 1)), STUDIO_TZ),
    to: fromZonedTime(endOfMonth(addYears(localToday, 2)), STUDIO_TZ),
  };
}

