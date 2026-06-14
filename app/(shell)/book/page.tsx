"use client";

import { TopBar } from "@/components/layout";
import { ClassCard, InlineCalendar } from "@/components/booking";
import { EmptyState } from "@/components/ui";
import {
  formatDateLong,
  studioToday,
  STUDIO_TZ,
} from "@/lib/dates";
import {
  getAllOccurrences,
  getScheduleRange,
  INSTRUCTORS,
} from "@/lib/mock/schedule";
import { useBookings } from "@/lib/mock/bookings-store";
import {
  CalendarX,
  Filter,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export default function BookPage() {
  const today = useMemo(() => studioToday(), []);
  const range = useMemo(() => getScheduleRange(), []);

  // Filter States
  const [selected, setSelected] = useState<Date>(today);
  const [instructorId, setInstructorId] = useState<string>("all");
  const [classType, setClassType] = useState<string>("all");
  const [intensity, setIntensity] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Fetch all occurrences
  const allOccurrences = useMemo(() => getAllOccurrences(), []);

  // Filter Occurrences for the Upcoming List
  const filteredOccurrences = useMemo(() => {
    return allOccurrences.filter((occ) => {
      // 1. Date Filter (on or after selected date's local day midnight)
      const occLocal = toZonedTime(occ.startsAt, STUDIO_TZ);
      const selectedLocal = toZonedTime(selected, STUDIO_TZ);

      const occDay = new Date(occLocal);
      occDay.setHours(0, 0, 0, 0);
      const selDay = new Date(selectedLocal);
      selDay.setHours(0, 0, 0, 0);

      if (occDay < selDay) return false;

      // 2. Instructor Filter
      if (instructorId !== "all" && occ.instructorId !== instructorId) {
        return false;
      }

      // 3. Class Type Filter (Regular vs Special)
      if (classType !== "all") {
        if (classType === "special" && !occ.template.isSpecial) return false;
        if (classType === "regular" && occ.template.isSpecial) return false;
      }

      // 4. Intensity Filter
      if (intensity !== "all" && occ.template.intensity !== intensity) {
        return false;
      }

      // 5. Spots Available Filter
      if (onlyAvailable && occ.slotsLeft <= 0) {
        return false;
      }

      return true;
    });
  }, [allOccurrences, selected, instructorId, classType, intensity, onlyAvailable]);

  // Group occurrences by local date for list presentation
  const groupedOccurrences = useMemo(() => {
    const groups: { [key: string]: { date: Date; items: typeof filteredOccurrences } } = {};

    filteredOccurrences.forEach((occ) => {
      const localDate = toZonedTime(occ.startsAt, STUDIO_TZ);
      const dateKey = format(localDate, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        const midnight = new Date(localDate);
        midnight.setHours(0, 0, 0, 0);
        groups[dateKey] = {
          date: fromZonedTime(midnight, STUDIO_TZ),
          items: [],
        };
      }
      groups[dateKey].items.push(occ);
    });

    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredOccurrences]);

  const { isBooked, book, cancel } = useBookings();

  // Quick reset for filters
  const resetFilters = () => {
    setSelected(today);
    setInstructorId("all");
    setClassType("all");
    setIntensity("all");
    setOnlyAvailable(false);
  };

  const isFiltered =
    selected.getTime() !== today.getTime() ||
    instructorId !== "all" ||
    classType !== "all" ||
    intensity !== "all" ||
    onlyAvailable;

  return (
    <>
      <TopBar title="Browse & Book" />

      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        
        {/* Calendar Section */}
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-display text-h3 font-medium text-neutral-ink">
              Studio Calendar
            </h2>
            {selected.getTime() !== today.getTime() && (
              <button
                onClick={() => setSelected(today)}
                className="text-caption font-sans font-medium text-primary-700 hover:text-primary-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Jump to Today
              </button>
            )}
          </div>
          <InlineCalendar
            selected={selected}
            onSelect={setSelected}
            min={range.from}
            max={range.to}
            instructorId={instructorId}
            classType={classType}
            intensity={intensity}
            onlyAvailable={onlyAvailable}
          />
        </section>

        {/* Filters Panel */}
        <section className="bg-neutral-card border border-neutral-line/30 rounded-lg p-4 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-neutral-line/20 pb-2">
            <h3 className="font-display text-h3 font-medium text-neutral-ink flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-600" />
              Schedule Filters
            </h3>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-caption font-sans font-medium text-neutral-text-3 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-sans">
            {/* Filter by Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-medium text-neutral-text-2">Class Type</label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-neutral-bg border border-neutral-line/40 text-body font-sans text-neutral-text-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow outline-none"
              >
                <option value="all">All Classes</option>
                <option value="regular">Regular Classes</option>
                <option value="special">Special Masterclasses</option>
              </select>
            </div>

            {/* Filter by Instructor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-medium text-neutral-text-2">Instructor</label>
              <select
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-neutral-bg border border-neutral-line/40 text-body font-sans text-neutral-text-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow outline-none"
              >
                <option value="all">All Instructors</option>
                {INSTRUCTORS.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Intensity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-medium text-neutral-text-2">Intensity</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-neutral-bg border border-neutral-line/40 text-body font-sans text-neutral-text-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow outline-none"
              >
                <option value="all">All Intensities</option>
                <option value="Gentle">Gentle</option>
                <option value="Balanced">Balanced</option>
                <option value="Strong">Strong</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-3 rounded-md border border-neutral-line/40 bg-neutral-bg hover:bg-primary-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-line/60 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 bg-neutral-bg cursor-pointer"
                />
                <span className="text-body-sm font-medium text-neutral-text-2">
                  Spots available only
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Upcoming List Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-h2 font-semibold text-neutral-ink">
              Upcoming Classes
            </h2>
            <span className="font-sans text-caption text-neutral-text-3">
              {filteredOccurrences.length} {filteredOccurrences.length === 1 ? "class" : "classes"} found
            </span>
          </div>

          {groupedOccurrences.length === 0 ? (
            <EmptyState
              icon={<CalendarX strokeWidth={1.75} className="h-6 w-6" />}
              title="No upcoming classes match"
              description="Try adjusting your filters, picking another starting date on the calendar, or clicking 'Clear all' to see all classes."
              action={
                isFiltered ? (
                  <button
                    onClick={resetFilters}
                    className="mt-4 px-4 py-2 bg-primary-500 text-neutral-ink font-display text-body-sm font-semibold rounded-md shadow-sm hover:bg-primary-600 transition-colors"
                  >
                    Reset all filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {groupedOccurrences.map((group) => (
                <div key={group.date.toISOString()} className="flex flex-col gap-3">
                  <h3 className="sticky top-0 z-10 py-1 bg-neutral-bg/95 backdrop-blur-xs font-display text-h3 font-medium text-neutral-ink border-b border-neutral-line/10">
                    {formatDateLong(group.date)}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.items.map((occ) => (
                      <ClassCard
                        key={occ.id}
                        occurrence={occ}
                        isBooked={isBooked(occ.id)}
                        onBook={() => book(occ.id)}
                        onCancel={() => cancel(occ.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}
