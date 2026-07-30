"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Sparkline } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYear } from "@/lib/dates";
import { addMonths, subMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";

interface InstructorStats {
  instructorId: string;
  instructorName: string;
  classesCount: number;
  totalAttendance: number;
  uniqueStudents: number;
  regularStudentRate: number;
  sixMonthTrend: number[];
}

interface AllTimeStats {
  classesCount: number;
  totalAttendance: number;
  uniqueStudents: number;
}

interface StaffOverviewTabProps {
  onLoading?: (loading: boolean) => void;
}

export function StaffOverviewTab({ onLoading }: StaffOverviewTabProps) {
  const [stats, setStats] = useState<InstructorStats[]>([]);
  const [allTimeStats, setAllTimeStats] = useState<
    Record<string, AllTimeStats>
  >({});
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
        `/api/admin/staff/stats?year=${year}&month=${month}`
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAllTimeStats(data.allTimeStats);
      }
    } catch (error) {
      console.error("Failed to load staff stats:", error);
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
          Staff Performance Overview
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

      {/* Staff Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} elevation="sm" className="border border-neutral-line">
              <div className="h-48 bg-neutral-line/20 rounded animate-pulse" />
            </Card>
          ))}
        </div>
      ) : stats.length === 0 ? (
        <Card elevation="sm" className="border border-neutral-line p-8 text-center">
          <p className="text-neutral-text-2">No staff members found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((instructor) => {
            const allTime = allTimeStats[instructor.instructorId];
            return (
              <Card
                key={instructor.instructorId}
                elevation="sm"
                className="border border-neutral-line flex flex-col gap-4"
              >
                {/* Header with name and sparkline */}
                <CardHeader className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-h4 font-semibold text-neutral-ink">
                      {instructor.instructorName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-text-3">
                    <span className="text-caption font-medium">6mo trend</span>
                    <Sparkline
                      data={instructor.sixMonthTrend}
                      width={50}
                      height={20}
                      color="currentColor"
                    />
                  </div>
                </CardHeader>

                <CardBody className="flex flex-col gap-4">
                  {/* Main stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                        Classes Taught
                      </p>
                      <p className="font-display text-display-sm font-bold text-neutral-ink">
                        {instructor.classesCount}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                        Total Attendance
                      </p>
                      <p className="font-display text-display-sm font-bold text-neutral-ink">
                        {instructor.totalAttendance}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                        Unique Students
                      </p>
                      <p className="font-display text-display-sm font-bold text-neutral-ink">
                        {instructor.uniqueStudents}
                      </p>
                    </div>
                  </div>

                  {/* Secondary stat: repeat-student rate */}
                  <div className="pt-2 border-t border-neutral-line/50">
                    <div className="flex items-center justify-between">
                      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3">
                        Repeat-Student Rate
                      </p>
                      <p className="font-display text-body-sm font-bold text-primary-700">
                        {instructor.regularStudentRate}%
                      </p>
                    </div>
                    <p className="text-caption text-neutral-text-3 mt-1">
                      Students attending 3+ times this month
                    </p>
                  </div>

                  {/* All-time stats */}
                  {allTime && (
                    <div className="pt-1.5 border-t border-neutral-line/50">
                      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-neutral-text-3 mb-1.5">
                        All-Time
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-0">
                          <p className="text-caption text-neutral-text-3 leading-tight">
                            Classes
                          </p>
                          <p className="font-display text-body font-semibold text-neutral-ink">
                            {allTime.classesCount}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0">
                          <p className="text-caption text-neutral-text-3 leading-tight">
                            Attendance
                          </p>
                          <p className="font-display text-body font-semibold text-neutral-ink">
                            {allTime.totalAttendance}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0">
                          <p className="text-caption text-neutral-text-3 leading-tight">
                            Unique
                          </p>
                          <p className="font-display text-body font-semibold text-neutral-ink">
                            {allTime.uniqueStudents}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
