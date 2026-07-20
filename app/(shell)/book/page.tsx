"use client";

import { TopBar } from "@/components/layout";
import { ClassCard, InlineCalendar } from "@/components/booking";
import { EmptyState } from "@/components/ui";
import {
  formatDateLong,
  studioToday,
  STUDIO_TZ,
  isSameStudioDay,
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
  RotateCcw,
  X,
} from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export default function BookPage() {
  const today = useMemo(() => studioToday(), []);
  const range = useMemo(() => getScheduleRange(), []);

  // Filter States - default selected is null (unfiltered/all upcoming)
  const [selected, setSelected] = useState<Date | null>(null);
  const [instructorId, setInstructorId] = useState<string>("all");
  const [classType, setClassType] = useState<string>("all");
  const [intensity, setIntensity] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Fetch all occurrences
  const allOccurrences = useMemo(() => getAllOccurrences(), []);

  // Filter Occurrences for the Upcoming List
  const filteredOccurrences = useMemo(() => {
    return allOccurrences.filter((occ) => {
      // 1. Date Filter
      const occLocal = toZonedTime(occ.startsAt, STUDIO_TZ);
      const occDay = new Date(occLocal);
      occDay.setHours(0, 0, 0, 0);

      if (selected) {
        // If a specific day is clicked, filter to ONLY that exact day!
        const selectedLocal = toZonedTime(selected, STUDIO_TZ);
        const selDay = new Date(selectedLocal);
        selDay.setHours(0, 0, 0, 0);

        if (occDay.getTime() !== selDay.getTime()) return false;
      } else {
        // If no day is selected (unfiltered), show all upcoming classes starting from today onwards!
        const todayLocal = toZonedTime(today, STUDIO_TZ);
        const todayMidnight = new Date(todayLocal);
        todayMidnight.setHours(0, 0, 0, 0);

        if (occDay < todayMidnight) return false;
      }

      // 2. Instructor Filter
      if (instructorId !== "all" && occ.instructorId !== instructorId) {
        return false;
      }

      // 3. Class Type Filter (Regular vs Special)
      if (classType !== "all") {
        if (classType === "special" && !occ.isSpecial) return false;
        if (classType === "regular" && occ.isSpecial) return false;
      }

      // 4. Intensity Filter
      if (intensity !== "all" && occ.intensity !== intensity) {
        return false;
      }

      // 5. Spots Available Filter
      if (onlyAvailable && occ.slotsLeft <= 0) {
        return false;
      }

      return true;
    });
  }, [allOccurrences, selected, today, instructorId, classType, intensity, onlyAvailable]);

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
  const feedRef = useRef<HTMLDivElement>(null);

  // Handle calendar day select / toggle
  const handleSelectDate = (date: Date) => {
    if (selected && isSameStudioDay(date, selected)) {
      setSelected(null); // Clicked selected date -> toggle off / unfilter!
    } else {
      setSelected(date); // Clicked a new date -> filter to that day!
      // On mobile, auto-scroll to the feed so user sees the results
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setTimeout(() => {
          feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    }
  };

  // Quick reset for filters
  const resetFilters = () => {
    setSelected(null);
    setInstructorId("all");
    setClassType("all");
    setIntensity("all");
    setOnlyAvailable(false);
  };

  const isFiltered =
    selected !== null ||
    instructorId !== "all" ||
    classType !== "all" ||
    intensity !== "all" ||
    onlyAvailable;

  return (
    <>
      <TopBar title="Browse & Book" />

      {/* Side-by-Side Responsive Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full pb-12 items-start mt-4">
        
        {/* Left Column: Calendar (Column span 7 on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-display text-h3 font-medium text-neutral-ink">
              Studio Calendar
            </h2>
            {selected !== null && (
              <button
                onClick={() => setSelected(null)}
                className="text-caption font-sans font-medium text-primary-700 hover:text-primary-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Show All Upcoming
              </button>
            )}
          </div>
          <InlineCalendar
            selected={selected}
            onSelect={handleSelectDate}
            min={range.from}
            max={range.to}
            instructorId={instructorId}
            classType={classType}
            intensity={intensity}
            onlyAvailable={onlyAvailable}
          />
        </div>

        {/* Right Column: Filters and Feed (Column span 5 on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Compact Filters Bar */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-body-sm font-medium text-neutral-text-2 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary-600" />
                Filters
              </span>
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] font-sans font-medium text-neutral-text-3 hover:text-primary-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 font-sans">
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-neutral-bg border border-neutral-line/30 text-body-sm font-sans text-neutral-text-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow outline-none"
              >
                <option value="all">All Types</option>
                <option value="regular">Regular</option>
                <option value="special">Masterclass</option>
              </select>

              <select
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-neutral-bg border border-neutral-line/30 text-body-sm font-sans text-neutral-text-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow outline-none"
              >
                <option value="all">All Instructors</option>
                {INSTRUCTORS.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>

              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-neutral-bg border border-neutral-line/30 text-body-sm font-sans text-neutral-text-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow outline-none"
              >
                <option value="all">All Intensities</option>
                <option value="Gentle">Gentle</option>
                <option value="Balanced">Balanced</option>
                <option value="Strong">Strong</option>
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer select-none px-2 rounded-md border border-neutral-line/30 bg-neutral-bg hover:bg-primary-50/40 transition-colors h-8">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-line/60 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 bg-neutral-bg cursor-pointer"
                />
                <span className="text-body-sm font-medium text-neutral-text-2 truncate">
                  Open spots
                </span>
              </label>
            </div>
          </section>

          {/* Upcoming List Feed Section */}
          <section ref={feedRef} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-h2 font-semibold text-neutral-ink">
                  {selected ? "Selected Day" : "Upcoming Classes"}
                </h2>
                {selected && (
                  <span className="flex items-center gap-1 bg-primary-100 text-primary-900 text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full border border-primary-200 shadow-xs">
                    {format(toZonedTime(selected, STUDIO_TZ), "MMMM d")}
                    <button
                      onClick={() => setSelected(null)}
                      className="hover:text-primary-600 transition-colors ml-1 p-0.5 rounded-full hover:bg-primary-200"
                      title="Clear date filter"
                    >
                      <X className="h-3 w-3 text-primary-700" strokeWidth={2.5} />
                    </button>
                  </span>
                )}
              </div>
              <span className="font-sans text-caption text-neutral-text-3 shrink-0">
                {filteredOccurrences.length} {filteredOccurrences.length === 1 ? "class" : "classes"}
              </span>
            </div>

            {groupedOccurrences.length === 0 ? (
              <EmptyState
                icon={<CalendarX strokeWidth={1.75} className="h-6 w-6" />}
                title={selected ? "No classes on this day" : "No upcoming classes match"}
                description={
                  selected
                    ? "There are no classes scheduled or matching your active filters for this specific date."
                    : "Try adjusting your filters, picking another starting date on the calendar, or clicking 'Clear all'."
                }
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
              <div className="flex flex-col gap-6 max-h-[70vh] lg:max-h-[75dvh] overflow-y-auto scrollbar-none pr-1">
                {groupedOccurrences.map((group) => (
                  <div key={group.date.toISOString()} className="flex flex-col gap-3">
                    <h3 className="sticky top-0 z-10 py-1 bg-neutral-bg/95 backdrop-blur-xs font-display text-h3 font-medium text-neutral-ink border-b border-neutral-line/10">
                      {formatDateLong(group.date)}
                    </h3>
                    <div className="flex flex-col gap-4">
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

      </div>
    </>
  );
}
