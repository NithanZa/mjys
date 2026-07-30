import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";

export const dynamic = "force-dynamic";

interface InstructorAffinity {
  instructorId: string;
  instructorName: string;
  attendanceCount: number;
}

interface ClassTimeAffinity {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  hour: number; // 0-23
  attendanceCount: number;
}

interface MemberAffinity {
  memberId: string;
  favoriteInstructor: InstructorAffinity | null;
  preferredClassTimes: ClassTimeAffinity[];
}

/**
 * GET /api/admin/members/affinity?memberId=...
 * Returns favorite instructor and preferred class times for a member.
 */
export async function GET(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get all CHECKED_IN attendances for this member with instructor and class info
    const attendances = await prisma.attendance.findMany({
      where: {
        memberId,
        status: "CHECKED_IN",
      },
      include: {
        classOccurrence: {
          select: {
            startsAt: true,
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate favorite instructor
    const instructorCounts = new Map<
      string,
      { id: string; name: string; count: number }
    >();

    attendances.forEach((att) => {
      const instructor = att.classOccurrence.instructor;
      const key = instructor.id;
      if (!instructorCounts.has(key)) {
        instructorCounts.set(key, { id: instructor.id, name: instructor.name, count: 0 });
      }
      const entry = instructorCounts.get(key)!;
      entry.count += 1;
    });

    let favoriteInstructor: InstructorAffinity | null = null;
    if (instructorCounts.size > 0) {
      const sorted = Array.from(instructorCounts.values()).sort(
        (a, b) => b.count - a.count
      );
      favoriteInstructor = {
        instructorId: sorted[0].id,
        instructorName: sorted[0].name,
        attendanceCount: sorted[0].count,
      };
    }

    // Calculate preferred class times (day of week + hour)
    const timeCounts = new Map<string, number>();

    attendances.forEach((att) => {
      const classTime = toZonedTime(
        new Date(att.classOccurrence.startsAt),
        STUDIO_TZ
      );
      const dayOfWeek = classTime.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const hour = classTime.getHours();
      const key = `${dayOfWeek}-${hour}`;

      timeCounts.set(key, (timeCounts.get(key) || 0) + 1);
    });

    const preferredClassTimes: ClassTimeAffinity[] = Array.from(
      timeCounts.entries()
    )
      .map(([key, count]) => {
        const [dayOfWeek, hourStr] = key.split("-");
        return {
          dayOfWeek,
          hour: parseInt(hourStr, 10),
          attendanceCount: count,
        };
      })
      .sort((a, b) => b.attendanceCount - a.attendanceCount)
      .slice(0, 5); // Top 5 preferred times

    const affinity: MemberAffinity = {
      memberId,
      favoriteInstructor,
      preferredClassTimes,
    };

    return NextResponse.json(affinity);
  } catch (error) {
    console.error("[api-admin-members-affinity] Error:", error);
    return NextResponse.json(
      { error: "Failed to load member affinity" },
      { status: 500 }
    );
  }
}
