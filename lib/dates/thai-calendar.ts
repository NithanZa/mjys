// Thai festival detection for seasonal home cards (UTC+7 / Asia/Bangkok).
// Returns an active festival when the current studio-local date falls within a
// small window around the holiday, otherwise `null`.

import {
  addDays,
  endOfDay,
  isWithinInterval,
  startOfDay,
  startOfYear,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const STUDIO_TZ = "Asia/Bangkok";

export interface ThaiFestival {
  key: string;
  label: string;
  image: string;
  href?: string;
}

interface FestivalRule {
  key: string;
  label: string;
  image: string;
  href?: string;
  // Returns the festival "center" date for the given Gregorian year.
  // The caller adds a ±1 day (or so) window around that date.
  dateForYear: (year: number) => Date;
  windowDays?: number;
}

// ---------------------------------------------------------------------------
// Assets live in public/tigers/ (see public/tigers/CONTENTS.md for what each
// file depicts). None of the sheets (#1-#9) are dedicated festival art, so we
// deliberately pick individual, single-subject renders (#10-#17) here —
// sheets would show multiple stickers at once if used as a full-bleed card
// background, which looks broken. #10/#17 are large (2048x1447 / 1024x1024)
// so they downscale cleanly; #11-#16 are smaller (~360-630px wide) and will
// be upscaled somewhat for a full-width card — acceptable but slightly soft
// on high-DPI screens. Swap in dedicated festival art here if it's ever added.
// ---------------------------------------------------------------------------
const ASSETS = {
  songkran: "/tigers/LINE_ALBUM_tiger_260719_15.jpg",
  loyKrathong: "/tigers/LINE_ALBUM_tiger_260719_11.jpg",
  newYear: "/tigers/LINE_ALBUM_tiger_260719_12.jpg",
  chineseNewYear: "/tigers/LINE_ALBUM_tiger_260719_13.jpg",
  valentine: "/tigers/LINE_ALBUM_tiger_260719_14.jpg",
  halloween: "/tigers/LINE_ALBUM_tiger_260719_17.jpg",
  christmas: "/tigers/LINE_ALBUM_tiger_260719_10.jpg",
  mothersDay: "/tigers/LINE_ALBUM_tiger_260719_16.jpg",
  fathersDay: "/tigers/LINE_ALBUM_tiger_260719_16.jpg",
  chulalongkorn: "/tigers/LINE_ALBUM_tiger_260719_10.jpg",
};

// Lunar-ish movable dates for the next couple of years.
// Dates are in Bangkok local time and will be converted to UTC internally.
const LOY_KRATHONG_DATES: Record<number, [number, number]> = {
  2026: [11, 3],
  2027: [11, 22],
  2028: [11, 11],
};

const CHINESE_NEW_YEAR_DATES: Record<number, [number, number]> = {
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
};

function makeDate(year: number, month: number, day: number): Date {
  // Build a Bangkok-local naive date and convert it to a UTC timestamp.
  const zoned = toZonedTime(new Date(year, month - 1, day, 0, 0, 0), STUDIO_TZ);
  return fromZonedTime(zoned, STUDIO_TZ);
}

function startOfStudioDay(date: Date): Date {
  const zoned = toZonedTime(date, STUDIO_TZ);
  const start = startOfDay(zoned);
  return fromZonedTime(start, STUDIO_TZ);
}

function endOfStudioDay(date: Date): Date {
  const zoned = toZonedTime(date, STUDIO_TZ);
  const end = endOfDay(zoned);
  return fromZonedTime(end, STUDIO_TZ);
}

function fixedDate(month: number, day: number): (year: number) => Date {
  return (year) => makeDate(year, month, day);
}

function nearestLunarDate(
  map: Record<number, [number, number]>,
): (year: number) => Date {
  return (year) => {
    const fallback = map[year] ?? map[Math.max(...Object.keys(map).map(Number))];
    const [month, day] = fallback;
    return makeDate(year, month, day);
  };
}

const RULES: FestivalRule[] = [
  {
    key: "newYear",
    label: "Happy New Year",
    image: ASSETS.newYear,
    href: "/promotion",
    dateForYear: fixedDate(1, 1),
    windowDays: 2,
  },
  {
    key: "chineseNewYear",
    label: "Happy Chinese New Year",
    image: ASSETS.chineseNewYear,
    href: "/promotion",
    dateForYear: nearestLunarDate(CHINESE_NEW_YEAR_DATES),
    windowDays: 2,
  },
  {
    key: "valentine",
    label: "Happy Valentine's Day",
    image: ASSETS.valentine,
    href: "/promotion",
    dateForYear: fixedDate(2, 14),
    windowDays: 1,
  },
  {
    key: "songkran",
    label: "happy SongKran Festival",
    image: ASSETS.songkran,
    href: "/book",
    dateForYear: fixedDate(4, 13),
    windowDays: 2,
  },
  {
    key: "mothersDay",
    label: "Happy Mother's Day",
    image: ASSETS.mothersDay,
    href: "/book",
    dateForYear: fixedDate(8, 12),
    windowDays: 1,
  },
  {
    key: "loyKrathong",
    label: "Happy Loy Krathong",
    image: ASSETS.loyKrathong,
    href: "/book",
    dateForYear: nearestLunarDate(LOY_KRATHONG_DATES),
    windowDays: 2,
  },
  {
    key: "halloween",
    label: "Happy Halloween",
    image: ASSETS.halloween,
    href: "/promotion",
    dateForYear: fixedDate(10, 31),
    windowDays: 1,
  },
  {
    key: "chulalongkorn",
    label: "Chulalongkorn Day",
    image: ASSETS.chulalongkorn,
    href: "/book",
    dateForYear: fixedDate(10, 23),
    windowDays: 1,
  },
  {
    key: "fathersDay",
    label: "Happy Father's Day",
    image: ASSETS.fathersDay,
    href: "/book",
    dateForYear: fixedDate(12, 5),
    windowDays: 1,
  },
  {
    key: "christmas",
    label: "Merry Christmas",
    image: ASSETS.christmas,
    href: "/promotion",
    dateForYear: fixedDate(12, 25),
    windowDays: 1,
  },
];

export function getActiveThaiFestival(now: Date = new Date()): ThaiFestival | null {
  const studioNow = toZonedTime(now, STUDIO_TZ);
  const year = studioNow.getFullYear();

  for (const rule of RULES) {
    const center = rule.dateForYear(year);
    const window = rule.windowDays ?? 1;
    const start = startOfStudioDay(addDays(center, -window));
    const end = endOfStudioDay(addDays(center, window));

    if (
      isWithinInterval(toZonedTime(now, STUDIO_TZ), {
        start: toZonedTime(start, STUDIO_TZ),
        end: toZonedTime(end, STUDIO_TZ),
      })
    ) {
      return {
        key: rule.key,
        label: rule.label,
        image: rule.image,
        href: rule.href,
      };
    }
  }

  return null;
}

export function isThaiFestivalActive(now: Date = new Date()): boolean {
  return getActiveThaiFestival(now) !== null;
}
