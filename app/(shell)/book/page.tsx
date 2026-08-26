"use client";

import { TopBar } from "@/components/layout";
import { ClassCard, InlineCalendar, PaidSpecialClassContactModal } from "@/components/booking";
import { EmptyState } from "@/components/ui";
import {
  formatDateLong,
  studioToday,
  STUDIO_TZ,
  isSameStudioDay,
} from "@/lib/dates";
import {
  fetchClasses,
  fetchOccurrence,
  OccurrenceView,
} from "@/lib/api/classes";
import {
  classMonthKey,
  classMonthRange,
  classNavigationRange,
  defaultClassRange,
  defaultClassMonthKeys,
} from "@/lib/api/class-range";
import {
  clearScheduleSnapshot,
  readScheduleSnapshot,
  writeScheduleSnapshot,
} from "@/lib/cache/client-schedule";
import {
  readBookPreferences,
  writeBookPreferences,
} from "@/lib/cache/client-preferences";
import { fetchInstructors, Instructor } from "@/lib/api/instructors";
import { INTENSITIES, INTENSITY_LABELS } from "@/lib/intensity";
import { useBookings } from "@/lib/api/bookings";
import {
  CalendarX,
  Filter,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

const CLIENT_MONTH_TTL_MS = 3 * 60 * 1000;

export default function BookPage() {
  const today = useMemo(() => studioToday(), []);
  const initialRange = useMemo(() => defaultClassRange(today), [today]);
  const navigationRange = useMemo(() => classNavigationRange(today), [today]);
  const initialMonthKeys = useMemo(
    () => new Set(defaultClassMonthKeys(today)),
    [today],
  );

  // Filter States - default selected is null (unfiltered/all upcoming)
  const [selected, setSelected] = useState<Date | null>(null);
  const [instructorId, setInstructorId] = useState<string>("all");
  const [classType, setClassType] = useState<string>("all");
  const [intensity, setIntensity] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Fetch all occurrences + instructors from the real DB-backed API
  const [allOccurrences, setAllOccurrences] = useState<OccurrenceView[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const [calendarInitialMonth, setCalendarInitialMonth] = useState(today);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const visibleMonthKey = classMonthKey(visibleMonth);
  const [loadingMonthKeys, setLoadingMonthKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const loadedMonthKeys = useRef(new Map<string, number>());
  const inFlightMonthKeys = useRef(new Set<string>());
  const initialLoadInFlight = useRef(true);
  const visibleMonthRef = useRef(visibleMonth);
  visibleMonthRef.current = visibleMonth;

  useEffect(() => {
    const preferences = readBookPreferences();
    if (preferences) {
      const storedMonth = new Date(preferences.visibleMonth);
      const restoredMonth =
        storedMonth >= navigationRange.from && storedMonth <= navigationRange.to
          ? storedMonth
          : today;
      const storedSelected = preferences.selectedDate
        ? new Date(preferences.selectedDate)
        : null;
      setVisibleMonth(restoredMonth);
      setCalendarInitialMonth(restoredMonth);
      setSelected(
        storedSelected &&
          storedSelected >= navigationRange.from &&
          storedSelected <= navigationRange.to
          ? storedSelected
          : null,
      );
      setInstructorId(preferences.instructorId);
      setClassType(preferences.classType);
      setIntensity(preferences.intensity);
      setOnlyAvailable(preferences.onlyAvailable);
    }
    setPreferencesReady(true);
  }, [navigationRange.from, navigationRange.to, today]);

  useEffect(() => {
    if (
      instructorId !== "all" &&
      instructors.length > 0 &&
      !instructors.some((instructor) => instructor.id === instructorId)
    ) {
      setInstructorId("all");
    }
  }, [instructorId, instructors]);

  const mergeOccurrences = useCallback((occurrences: OccurrenceView[]) => {
    setAllOccurrences((current) => {
      const byId = new Map(current.map((occurrence) => [occurrence.id, occurrence]));
      occurrences.forEach((occurrence) => byId.set(occurrence.id, occurrence));
      return [...byId.values()].sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      );
    });
  }, []);

  const replaceOccurrencesInRange = useCallback(
    (occurrences: OccurrenceView[], from: Date, to: Date) => {
      setAllOccurrences((current) => {
        const byId = new Map(
          current
            .filter(
              (occurrence) =>
                occurrence.startsAt < from || occurrence.startsAt > to,
            )
            .map((occurrence) => [occurrence.id, occurrence]),
        );
        occurrences.forEach((occurrence) => byId.set(occurrence.id, occurrence));
        return [...byId.values()].sort(
          (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
        );
      });
    },
    [],
  );

  const loadMonth = useCallback(
    async (month: Date) => {
      const key = classMonthKey(month);
      const loadedAt = loadedMonthKeys.current.get(key);
      const isFresh =
        loadedAt !== undefined && Date.now() - loadedAt < CLIENT_MONTH_TTL_MS;

      if (
        isFresh ||
        inFlightMonthKeys.current.has(key) ||
        (initialLoadInFlight.current && initialMonthKeys.has(key))
      ) {
        return;
      }

      inFlightMonthKeys.current.add(key);
      setLoadingMonthKeys((keys) => new Set(keys).add(key));

      try {
        const range = classMonthRange(month);
        const occurrences = await fetchClasses(range.from, range.to);
        replaceOccurrencesInRange(occurrences, range.from, range.to);
        loadedMonthKeys.current.set(key, Date.now());
      } catch (error) {
        console.error("Failed to load a schedule month:", error);
      } finally {
        inFlightMonthKeys.current.delete(key);
        setLoadingMonthKeys((keys) => {
          const next = new Set(keys);
          next.delete(key);
          return next;
        });
      }
    },
    [initialMonthKeys, replaceOccurrencesInRange],
  );

  const refreshOccurrence = useCallback(async (occurrenceId: string) => {
    clearScheduleSnapshot();
    try {
      const occurrence = await fetchOccurrence(occurrenceId);
      setAllOccurrences((current) => {
        const remaining = current.filter((item) => item.id !== occurrenceId);
        if (occurrence) remaining.push(occurrence);
        return remaining.sort(
          (first, second) =>
            first.startsAt.getTime() - second.startsAt.getTime(),
        );
      });
    } catch (error) {
      console.error("Failed to refresh class availability:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const snapshot = readScheduleSnapshot(initialRange.from, initialRange.to);
    if (snapshot) {
      mergeOccurrences(snapshot);
      initialMonthKeys.forEach((key) =>
        loadedMonthKeys.current.set(key, Date.now()),
      );
      setLoading(false);
    }

    let scheduleFailed = false;
    fetchClasses(initialRange.from, initialRange.to)
      .then((occurrences) => {
        if (cancelled) return;
        replaceOccurrencesInRange(
          occurrences,
          initialRange.from,
          initialRange.to,
        );
        initialMonthKeys.forEach((key) =>
          loadedMonthKeys.current.set(key, Date.now()),
        );
        writeScheduleSnapshot(initialRange.from, initialRange.to, occurrences);
      })
      .catch((err) => {
        scheduleFailed = true;
        console.error("Failed to load schedule:", err);
      })
      .finally(() => {
        initialLoadInFlight.current = false;
        if (!cancelled) {
          setLoading(false);
          if (scheduleFailed && !snapshot) {
            void loadMonth(visibleMonthRef.current);
          }
        }
      });

    fetchInstructors()
      .then((ins) => {
        if (!cancelled) setInstructors(ins);
      })
      .catch((err) => {
        console.error("Failed to load instructors:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [
    initialMonthKeys,
    initialRange.from,
    initialRange.to,
    loadMonth,
    mergeOccurrences,
    replaceOccurrencesInRange,
  ]);

  const handleVisibleMonthChange = useCallback(
    (month: Date) => {
      setVisibleMonth(month);
      void loadMonth(month);
    },
    [loadMonth],
  );

  useEffect(() => {
    if (!preferencesReady) return;
    writeBookPreferences({
      selectedDate: selected?.toISOString() ?? null,
      visibleMonth: visibleMonth.toISOString(),
      instructorId,
      classType,
      intensity,
      onlyAvailable,
    });
  }, [
    classType,
    instructorId,
    intensity,
    onlyAvailable,
    preferencesReady,
    selected,
    visibleMonth,
  ]);
  const visibleScheduleLoading =
    loading || loadingMonthKeys.has(visibleMonthKey);
  const feedLoading =
    loading ||
    (selected !== null && loadingMonthKeys.has(classMonthKey(selected)));

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

  const {
    isBooked,
    isPaidSpecialBooking,
    book,
    cancel,
    loading: bookingsLoading,
  } = useBookings();
  const [contactRequestClassName, setContactRequestClassName] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Handle calendar day select / toggle
  const handleSelectDate = (date: Date) => {
    if (selected && isSameStudioDay(date, selected)) {
      setSelected(null); // Clicked selected date -> toggle off / unfilter!
    } else {
      void loadMonth(date);
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
            onVisibleMonthChange={handleVisibleMonthChange}
            min={navigationRange.from}
            max={navigationRange.to}
            initialMonth={calendarInitialMonth}
            loading={visibleScheduleLoading}
            occurrences={allOccurrences}
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
                {instructors.map((ins) => (
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
                {INTENSITIES.map((code) => (
                  <option key={code} value={code}>
                    {INTENSITY_LABELS[code]}
                  </option>
                ))}
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

            {feedLoading ? (
              <div className="py-12 text-center font-sans text-body-sm text-neutral-text-3">
                Loading schedule…
              </div>
            ) : groupedOccurrences.length === 0 ? (
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
                          bookingLoading={bookingsLoading}
                          isBooked={isBooked(occ.id)}
                          onBook={async () => {
                            await book(occ.id);
                            await refreshOccurrence(occ.id);
                          }}
                          onCancel={async () => {
                            if (isPaidSpecialBooking(occ.id)) {
                              setContactRequestClassName(occ.name);
                              return;
                            }
                            await cancel(occ.id);
                            await refreshOccurrence(occ.id);
                          }}
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
      <PaidSpecialClassContactModal
        open={contactRequestClassName !== null}
        onClose={() => setContactRequestClassName(null)}
        className={contactRequestClassName ?? ""}
      />
    </>
  );
}
