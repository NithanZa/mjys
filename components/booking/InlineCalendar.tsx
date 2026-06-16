"use client";

import { cn } from "@/lib/cn";
import { isSameStudioDay, STUDIO_TZ, formatTimeShort } from "@/lib/dates";
import {
    addMonths,
    format,
    isSameMonth,
    startOfMonth,
    startOfWeek,
    startOfDay,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { getOccurrencesForDay, OccurrenceView } from "@/lib/mock/schedule";
import Link from "next/link";

export interface InlineCalendarProps {
    selected: Date | null;
    onSelect: (date: Date) => void;
    min: Date;
    max: Date;
    instructorId?: string;
    classType?: string;
    intensity?: string;
    onlyAvailable?: boolean;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function InlineCalendar({
    selected,
    onSelect,
    min,
    max,
    instructorId = "all",
    classType = "all",
    intensity = "all",
    onlyAvailable = false,
}: InlineCalendarProps) {
    const [cursor, setCursor] = useState<Date>(() =>
        toZonedTime(selected || min, STUDIO_TZ),
    );

    const cells = useMemo(() => {
        const monthStart = startOfMonth(cursor);
        const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const list: Date[] = [];
        const day = new Date(gridStart);
        // Always render 42 cells (6 weeks) for layout stability.
        for (let i = 0; i < 42; i++) {
            list.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        return list;
    }, [cursor]);

    const minLocal = toZonedTime(min, STUDIO_TZ);
    const maxLocal = toZonedTime(max, STUDIO_TZ);

    const shift = (delta: number) => {
        setCursor((c) => addMonths(c, delta));
    };

    // Helper to check if start of days are equal in local time
    const startOfDayLocal = (d: Date) => {
        const copy = new Date(d);
        copy.setHours(0, 0, 0, 0);
        return copy;
    };

    return (
        <div className="w-full bg-neutral-card rounded-lg border border-neutral-line/40 p-4 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-h2 font-semibold text-neutral-ink">
                    {format(cursor, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => shift(-1)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-neutral-line/40 text-neutral-text-2 bg-neutral-bg hover:bg-primary-50 transition-colors"
                    >
                        <ChevronLeft strokeWidth={2.25} className="h-4 w-4 text-neutral-ink" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => shift(1)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-neutral-line/40 text-neutral-text-2 bg-neutral-bg hover:bg-primary-50 transition-colors"
                    >
                        <ChevronRight strokeWidth={2.25} className="h-4 w-4 text-neutral-ink" />
                    </button>
                </div>
            </div>

            {/* Weekdays Grid Header */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="text-center font-display text-[11px] font-medium uppercase tracking-[0.05em] text-neutral-text-3 py-0.5"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((dayLocal) => {
                    const inMonth = isSameMonth(dayLocal, cursor);
                    const cellUtcMidnight = fromZonedTime(dayLocal, STUDIO_TZ);
                    const isSelected = selected ? isSameStudioDay(cellUtcMidnight, selected) : false;
                    const isToday = isSameStudioDay(cellUtcMidnight, new Date());
                    
                    const tooEarly = dayLocal < startOfDayLocal(minLocal);
                    const tooLate = dayLocal > startOfDayLocal(maxLocal);
                    const disabled = tooEarly || tooLate;

                    // Get occurrences for this local day
                    let occurrences = getOccurrencesForDay(cellUtcMidnight);

                    if (instructorId && instructorId !== "all") {
                        occurrences = occurrences.filter((o) => o.instructorId === instructorId);
                    }
                    if (classType && classType !== "all") {
                        occurrences = occurrences.filter((o) => {
                            if (classType === "special") return !!o.template.isSpecial;
                            if (classType === "regular") return !o.template.isSpecial;
                            return true;
                        });
                    }
                    if (intensity && intensity !== "all") {
                        occurrences = occurrences.filter((o) => o.template.intensity === intensity);
                    }
                    if (onlyAvailable) {
                        occurrences = occurrences.filter((o) => o.slotsLeft > 0);
                    }

                    return (
                        <div
                            key={dayLocal.toISOString()}
                            onClick={() => {
                                if (!disabled) {
                                    onSelect(cellUtcMidnight);
                                }
                            }}
                            className={cn(
                                "group relative min-h-[56px] md:min-h-[105px] flex flex-col rounded-md border p-1 md:p-1.5 transition-all cursor-pointer select-none",
                                disabled && "opacity-30 cursor-not-allowed bg-neutral-bg/20",
                                !disabled && isSelected && "border-primary-500 bg-primary-100 shadow-sm ring-2 ring-primary-500/20",
                                !disabled && !isSelected && inMonth && "border-neutral-line/20 bg-neutral-bg hover:border-primary-300 hover:bg-neutral-bg/70",
                                !disabled && !isSelected && !inMonth && "border-transparent bg-neutral-bg/30 text-neutral-text-3 hover:border-primary-200"
                            )}
                        >
                            {/* Date Number Badge */}
                            <div className="flex justify-between items-center mb-0.5">
                                <span
                                    className={cn(
                                        "font-display text-caption font-semibold flex items-center justify-center h-5 w-5 rounded-full text-center",
                                        isToday && !isSelected && "bg-accent-500 text-neutral-bg font-bold",
                                        isSelected && "bg-primary-500 text-neutral-ink font-bold",
                                        !isToday && !isSelected && inMonth && "text-neutral-ink",
                                        !isToday && !isSelected && !inMonth && "text-neutral-text-3"
                                    )}
                                >
                                    {format(dayLocal, "d")}
                                </span>

                                {/* Compact mobile indicators */}
                                {occurrences.length > 0 && (
                                    <div className="flex md:hidden gap-0.5">
                                        {occurrences.map((occ) => (
                                            <span
                                                key={occ.id}
                                                className={cn(
                                                    "h-1 w-1 rounded-full",
                                                    occ.template.isSpecial
                                                        ? "bg-primary-800"
                                                        : "bg-primary-400"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Desktop: Sleek horizontal mini-pills (like Google Calendar) */}
                            <div className="hidden md:flex flex-col gap-0.5 flex-grow overflow-y-auto max-h-[70px] scrollbar-none mt-0.5">
                                {occurrences.map((occ) => {
                                    const isSpecial = occ.template.isSpecial;
                                    return (
                                        <Link
                                            key={occ.id}
                                            href={`/book/${occ.id}`}
                                            onClick={(e) => e.stopPropagation()} // don't select the date when clicking the class card
                                            className={cn(
                                                "flex items-center gap-1 px-1 py-0.5 rounded-xs border text-[9px] font-sans transition-all truncate hover:brightness-95",
                                                isSpecial
                                                    ? "bg-primary-900 text-primary-100 border-primary-800"
                                                    : "bg-primary-100 text-primary-900 border-primary-200"
                                            )}
                                            title={`${formatTimeShort(occ.startsAt)} - ${occ.template.name} (${occ.instructor.name})`}
                                        >
                                            <span className="font-bold shrink-0">{formatTimeShort(occ.startsAt)}</span>
                                            <span className="truncate flex-grow font-semibold">{occ.template.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Mobile indication label */}
                            <div className="md:hidden flex-grow flex items-end justify-center pb-0.5">
                                {occurrences.length > 0 && (
                                    <span className="text-[9px] font-sans font-medium text-neutral-text-3">
                                        {occurrences.length} {occurrences.length === 1 ? "cl" : "cls"}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend / Info */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-neutral-line/10 font-sans text-caption text-neutral-text-2">
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-5 rounded-xs border border-primary-200 bg-primary-100" />
                    <span className="text-[11px]">Regular Class</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-5 rounded-xs border border-primary-800 bg-primary-900" />
                    <span className="text-[11px]">Special Masterclass</span>
                </div>
                <div className="ml-auto text-neutral-text-3 italic text-[11px]">
                    Tap a date to filter, click again to clear
                </div>
            </div>
        </div>
    );
}
