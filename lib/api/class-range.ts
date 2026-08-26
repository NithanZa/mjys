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

export function classMonthKey(date: Date): string {
  return format(toZonedTime(date, STUDIO_TZ), "yyyy-MM");
}

export function classMonthRange(date: Date): ClassRange {
  const localDate = toZonedTime(date, STUDIO_TZ);
  return {
    from: fromZonedTime(startOfMonth(localDate), STUDIO_TZ),
    to: fromZonedTime(endOfMonth(localDate), STUDIO_TZ),
  };
}

export function defaultClassRange(today: Date): ClassRange {
  const localToday = toZonedTime(today, STUDIO_TZ);
  return {
    from: fromZonedTime(startOfDay(subDays(localToday, 1)), STUDIO_TZ),
    to: fromZonedTime(endOfMonth(addMonths(localToday, 2)), STUDIO_TZ),
  };
}

export function defaultClassMonthKeys(today: Date): string[] {
  const currentMonth = startOfMonth(toZonedTime(today, STUDIO_TZ));
  return Array.from({ length: 3 }, (_, offset) =>
    format(addMonths(currentMonth, offset), "yyyy-MM"),
  );
}

export function classNavigationRange(today: Date): ClassRange {
  const localToday = toZonedTime(today, STUDIO_TZ);
  return {
    from: fromZonedTime(startOfDay(subDays(localToday, 1)), STUDIO_TZ),
    to: fromZonedTime(endOfMonth(addYears(localToday, 2)), STUDIO_TZ),
  };
}
