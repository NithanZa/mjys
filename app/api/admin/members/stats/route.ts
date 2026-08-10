import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";

export const dynamic = "force-dynamic";

interface MembersStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembersThisMonth: number;
  packagesExpiringThisMonth: number;
  classesLeftOnTable: number;
  monthlyRevenue: number;
  mostPopularPackage: {
    name: string;
    count: number;
  } | null;
  sixMonthMemberTrend: {
    month: string;
    members: number | null;
  }[];
}

/**
 * GET /api/admin/members/stats?year=2026&month=7
 * Returns aggregate stats for all members for the given month (studio TZ).
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
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month (1-12)" },
        { status: 400 }
      );
    }

    // Total members
    const totalMembers = await prisma.member.count();

    // Active members: have at least one CHECKED_IN attendance in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeMembers = await prisma.member.count({
      where: {
        attendances: {
          some: {
            status: "CHECKED_IN",
            checkedInAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    const inactiveMembers = totalMembers - activeMembers;

    // New members this month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const newMembersThisMonth = await prisma.member.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Packages expiring this month
    const packagesExpiringThisMonth = await prisma.package.count({
      where: {
        expiresAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
    });

    // Classes left on table: sum of classesRemaining for expired packages
    const expiredPackages = await prisma.package.findMany({
      where: {
        status: "EXPIRED",
        classesRemaining: { gt: 0 },
      },
      select: { classesRemaining: true },
    });

    const classesLeftOnTable = expiredPackages.reduce(
      (sum, pkg) => sum + (pkg.classesRemaining || 0),
      0
    );

    // Monthly revenue: sum of offer prices for packages created this month
    const monthlyPackages = await prisma.package.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        offer: {
          select: { id: true, name: true, priceTHB: true },
        },
      },
    });

    const monthlyRevenue = monthlyPackages.reduce(
      (sum, pkg) => sum + pkg.offer.priceTHB,
      0
    );

    // Most popular package this month
    const packageCounts = new Map<string, { id: string; name: string; count: number }>();
    monthlyPackages.forEach((pkg) => {
      const key = pkg.offer.id;
      if (!packageCounts.has(key)) {
        packageCounts.set(key, { id: pkg.offer.id, name: pkg.offer.name, count: 0 });
      }
      const entry = packageCounts.get(key)!;
      entry.count += 1;
    });

    let mostPopularPackage: { name: string; count: number } | null = null;
    if (packageCounts.size > 0) {
      const sorted = Array.from(packageCounts.values()).sort(
        (a, b) => b.count - a.count
      );
      mostPopularPackage = {
        name: sorted[0].name,
        count: sorted[0].count,
      };
    }

    // 6-month member trend: new member count for last 6 months (including current)
    const now = toZonedTime(new Date(), STUDIO_TZ);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthMemberTrend = await Promise.all(
      Array.from({ length: 6 }, async (_, index) => {
        const trendMonth = new Date(year, month - 6 + index, 1);

        if (trendMonth > currentMonth) {
          return { month: format(trendMonth, "MMM"), members: null };
        }

        const trendMonthStart = new Date(
          trendMonth.getFullYear(),
          trendMonth.getMonth(),
          1
        );
        const trendMonthEnd = new Date(
          trendMonth.getFullYear(),
          trendMonth.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        const members = await prisma.member.count({
          where: {
            createdAt: {
              gte: trendMonthStart,
              lte: trendMonthEnd,
            },
          },
        });

        return { month: format(trendMonth, "MMM"), members };
      })
    );

    const stats: MembersStats = {
      totalMembers,
      activeMembers,
      inactiveMembers,
      newMembersThisMonth,
      packagesExpiringThisMonth,
      classesLeftOnTable,
      monthlyRevenue,
      mostPopularPackage,
      sixMonthMemberTrend,
    };

    return NextResponse.json({
      year,
      month,
      stats,
    });
  } catch (error) {
    console.error("[api-admin-members-stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to load members stats" },
      { status: 500 }
    );
  }
}
