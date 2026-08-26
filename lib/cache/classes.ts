import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache/tags";

const THREE_MINUTES = 3 * 60;

export const getCachedClassOccurrences = unstable_cache(
  async (fromIso: string, toIso: string) => {
    const occurrences = await prisma.classOccurrence.findMany({
      where: {
        startsAt: {
          gte: new Date(fromIso),
          lte: new Date(toIso),
        },
        isCancelled: false,
      },
      include: { instructor: true },
      orderBy: { startsAt: "asc" },
    });

    return occurrences.map((occurrence) => ({
      ...occurrence,
      slotsLeft: Math.max(0, occurrence.capacity - occurrence.bookedCount),
    }));
  },
  ["class-occurrences"],
  { revalidate: THREE_MINUTES, tags: [CACHE_TAGS.classes] },
);

export const getCachedInstructors = unstable_cache(
  async () =>
    prisma.instructor.findMany({
      orderBy: { order: "asc" },
    }),
  ["instructors"],
  { revalidate: THREE_MINUTES, tags: [CACHE_TAGS.instructors] },
);

export const getCachedAdminCalendar = unstable_cache(
  async (startIso: string, endIso: string) => {
    const startsAt = {
      gte: new Date(startIso),
      lt: new Date(endIso),
    };

    const [occurrences, instructors] = await Promise.all([
      prisma.classOccurrence.findMany({
        where: { startsAt },
        include: { instructor: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.instructor.findMany({
        orderBy: { order: "asc" },
      }),
    ]);

    return { occurrences, instructors };
  },
  ["admin-calendar"],
  {
    revalidate: THREE_MINUTES,
    tags: [CACHE_TAGS.classes, CACHE_TAGS.instructors],
  },
);
