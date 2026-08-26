import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";

export const dynamic = "force-dynamic";

interface InstructorStats {
  instructorId: string;
  instructorName: string;
  classesCount: number;
  totalAttendance: number;
  uniqueStudents: number;
  regularStudentRate: number; // percentage
  sixMonthTrend: number[]; // last 6 months of class counts
}

/**
 * GET /api/admin/staff/stats?year=2026&month=7
 * Returns stats for all instructors for the given month (studio TZ).
 * If not provided, defaults to current month.
 */
export async function GET(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    let year = parseInt(searchParams.get("year") || "", 10);
    let month = parseInt(searchParams.get("month") || "", 10);

    // Default to current month if not provided
    if (!year || !month || isNaN(year) || isNaN(month)) {
      const now = toZonedTime(new Date(), STUDIO_TZ);
      year = now.getFullYear();
      month = now.getMonth() + 1; // 1-indexed
    }

    // Validate month
    if (year < 2000 || year > 2100 || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid year or month" },
        { status: 400 }
      );
    }

    const getStats = unstable_cache(
      async (statsYear: number, statsMonth: number) => {
    // Get all instructors
    const instructors = await prisma.instructor.findMany({
      orderBy: { order: "asc" },
    });

    // Calculate stats for each instructor for the target month
    const stats: InstructorStats[] = [];

    for (const instructor of instructors) {
      // Month range in studio TZ
      const monthStart = fromZonedTime(
        new Date(statsYear, statsMonth - 1, 1),
        STUDIO_TZ,
      );
      const nextMonthStart = fromZonedTime(
        new Date(statsYear, statsMonth, 1),
        STUDIO_TZ,
      );

      // Classes taught this month
      const classesCount = await prisma.classOccurrence.count({
        where: {
          instructorId: instructor.id,
          startsAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
          isCancelled: false,
        },
      });

      // Total attendance (checked-in only) this month
      const attendances = await prisma.attendance.findMany({
        where: {
          classOccurrence: {
            instructorId: instructor.id,
            startsAt: {
              gte: monthStart,
              lt: nextMonthStart,
            },
            isCancelled: false,
          },
          status: "CHECKED_IN",
        },
        select: { memberId: true },
      });

      const totalAttendance = attendances.length;
      const uniqueStudents = new Set(attendances.map((a) => a.memberId)).size;

      // Repeat-student rate: % of unique students who attended 3+ times this month
      let regularStudentRate = 0;
      if (uniqueStudents > 0) {
        const attendanceByMember = new Map<string, number>();
        attendances.forEach((a) => {
          attendanceByMember.set(
            a.memberId,
            (attendanceByMember.get(a.memberId) || 0) + 1
          );
        });
        const regulars = Array.from(attendanceByMember.values()).filter(
          (count) => count >= 3
        ).length;
        regularStudentRate = Math.round((regulars / uniqueStudents) * 100);
      }

      // 6-month trend: class count for last 6 months (including current)
      const sixMonthTrend: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const trendMonth = new Date(statsYear, statsMonth - 1 - i, 1);
        const trendMonthStart = fromZonedTime(
          new Date(trendMonth.getFullYear(), trendMonth.getMonth(), 1),
          STUDIO_TZ,
        );
        const nextTrendMonthStart = fromZonedTime(
          new Date(trendMonth.getFullYear(), trendMonth.getMonth() + 1, 1),
          STUDIO_TZ,
        );

        const count = await prisma.classOccurrence.count({
          where: {
            instructorId: instructor.id,
            startsAt: {
              gte: trendMonthStart,
              lt: nextTrendMonthStart,
            },
            isCancelled: false,
          },
        });
        sixMonthTrend.push(count);
      }

      stats.push({
        instructorId: instructor.id,
        instructorName: instructor.name,
        classesCount,
        totalAttendance,
        uniqueStudents,
        regularStudentRate,
        sixMonthTrend,
      });
    }

    // Also return all-time stats for each instructor
    const allTimeStats: Record<
      string,
      {
        classesCount: number;
        totalAttendance: number;
        uniqueStudents: number;
      }
    > = {};

    for (const instructor of instructors) {
      const classesCount = await prisma.classOccurrence.count({
        where: {
          instructorId: instructor.id,
          isCancelled: false,
        },
      });

      const attendances = await prisma.attendance.findMany({
        where: {
          classOccurrence: {
            instructorId: instructor.id,
            isCancelled: false,
          },
          status: "CHECKED_IN",
        },
        select: { memberId: true },
      });

      const totalAttendance = attendances.length;
      const uniqueStudents = new Set(attendances.map((a) => a.memberId)).size;

      allTimeStats[instructor.id] = {
        classesCount,
        totalAttendance,
        uniqueStudents,
      };
    }

        return { stats, allTimeStats };
      },
      ["admin-staff-stats"],
      { revalidate: 180, tags: [CACHE_TAGS.staffStats] },
    );

    const { stats, allTimeStats } = await getStats(year, month);

    return NextResponse.json({
      year,
      month,
      stats,
      allTimeStats,
    });
  } catch (error) {
    console.error("[api-admin-staff-stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to load staff stats" },
      { status: 500 }
    );
  }
}
