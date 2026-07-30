"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Sparkline } from "@/components/ui";
import { ChevronLeft, ChevronRight, Users, TrendingUp, Package, DollarSign } from "lucide-react";
import { formatMonthYear } from "@/lib/dates";
import { addMonths, subMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";

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
  sixMonthMemberTrend: number[];
}

interface MembersOverviewTabProps {
  onLoading?: (loading: boolean) => void;
}

export function MembersOverviewTab({ onLoading }: MembersOverviewTabProps) {
  const [stats, setStats] = useState<MembersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = toZonedTime(new Date(), STUDIO_TZ);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const loadStats = async (date: Date) => {
    setLoading(true);
    onLoading?.(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-indexed
      const res = await fetch(
        `/api/admin/members/stats?year=${year}&month=${month}`
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load members stats:", error);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  useEffect(() => {
    loadStats(selectedDate);
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setSelectedDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => addMonths(prev, 1));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h2 font-semibold text-neutral-ink">
          Members Overview
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="grid h-9 w-9 place-items-center rounded-sm border border-neutral-line hover:bg-neutral-line/20 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[140px] text-center font-sans text-body-sm font-semibold text-neutral-ink">
            {formatMonthYear(selectedDate)}
          </div>
          <button
            onClick={handleNextMonth}
            className="grid h-9 w-9 place-items-center rounded-sm border border-neutral-line hover:bg-neutral-line/20 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} elevation="sm" className="border border-neutral-line">
              <div className="h-32 bg-neutral-line/20 rounded animate-pulse" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Members */}
            <Card elevation="sm" className="border border-neutral-line">
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                    Total Members
                  </p>
                  <Users className="h-4 w-4 text-neutral-text-3" />
                </div>
                <p className="font-display text-display-sm font-bold text-neutral-ink">
                  {stats.totalMembers}
                </p>
                <p className="text-caption text-neutral-text-3">
                  {stats.activeMembers} active, {stats.inactiveMembers} inactive
                </p>
              </CardBody>
            </Card>

            {/* New Members This Month */}
            <Card elevation="sm" className="border border-neutral-line">
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                    New This Month
                  </p>
                  <TrendingUp className="h-4 w-4 text-primary-600" />
                </div>
                <p className="font-display text-display-sm font-bold text-neutral-ink">
                  {stats.newMembersThisMonth}
                </p>
                <p className="text-caption text-neutral-text-3">
                  Joined this month
                </p>
              </CardBody>
            </Card>

            {/* Packages Expiring */}
            <Card elevation="sm" className="border border-neutral-line">
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                    Expiring Soon
                  </p>
                  <Package className="h-4 w-4 text-orange-600" />
                </div>
                <p className="font-display text-display-sm font-bold text-neutral-ink">
                  {stats.packagesExpiringThisMonth}
                </p>
                <p className="text-caption text-neutral-text-3">
                  Packages expiring this month
                </p>
              </CardBody>
            </Card>

            {/* Monthly Revenue */}
            <Card elevation="sm" className="border border-neutral-line">
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                    Revenue
                  </p>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="font-display text-display-sm font-bold text-neutral-ink">
                  ฿{stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-caption text-neutral-text-3">
                  This month
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Classes Left on Table */}
            <Card elevation="sm" className="border border-neutral-line">
              <CardBody className="flex flex-col gap-3">
                <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                  Classes Left on Table
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-h3 font-bold text-neutral-ink">
                    {stats.classesLeftOnTable}
                  </p>
                  <p className="text-body-sm text-neutral-text-3">
                    unused classes in expired packages
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Most Popular Package */}
            <Card elevation="sm" className="border border-neutral-line">
              <CardBody className="flex flex-col gap-3">
                <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                  Most Popular Package
                </p>
                {stats.mostPopularPackage ? (
                  <div>
                    <p className="font-display text-h4 font-bold text-neutral-ink">
                      {stats.mostPopularPackage.name}
                    </p>
                    <p className="text-body-sm text-neutral-text-3 mt-1">
                      {stats.mostPopularPackage.count} sold this month
                    </p>
                  </div>
                ) : (
                  <p className="text-body-sm text-neutral-text-3">
                    No packages sold this month
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* 6-Month Trend */}
          <Card elevation="sm" className="border border-neutral-line">
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                  6-Month Member Growth
                </p>
                <Sparkline
                  data={stats.sixMonthMemberTrend}
                  width={100}
                  height={24}
                  color="currentColor"
                  className="text-primary-600"
                />
              </div>
              <p className="text-body-sm text-neutral-text-3">
                New members per month over the last 6 months
              </p>
            </CardBody>
          </Card>
        </>
      ) : (
        <Card elevation="sm" className="border border-neutral-line p-8 text-center">
          <p className="text-neutral-text-2">Failed to load members stats.</p>
        </Card>
      )}
    </div>
  );
}
