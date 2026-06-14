"use client";

import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { isSameStudioDay, STUDIO_TZ } from "@/lib/dates";
import {
    addMonths,
    format,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export interface CalendarSheetProps {
    open: boolean;
    onClose: () => void;
    selected: Date;
    /** Earliest selectable date (inclusive). */
    min: Date;
    /** Latest selectable date (inclusive). */
    max: Date;
    onSelect: (date: Date) => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export function CalendarSheet({
    open,
    onClose,
    selected,
    min,
    max,
    onSelect,
}: CalendarSheetProps) {
    // The visible "month cursor" lives in studio-local time.
    const [cursor, setCursor] = useState<Date>(() =>
        toZonedTime(selected, STUDIO_TZ),
    );

    const cells = useMemo(() => buildMonthCells(cursor), [cursor]);

    const minLocal = toZonedTime(min, STUDIO_TZ);
    const maxLocal = toZonedTime(max, STUDIO_TZ);
    const selectedLocal = toZonedTime(selected, STUDIO_TZ);

    function shift(monthDelta: number) {
        setCursor((c) => addMonths(c, monthDelta));
    }

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={format(cursor, "MMMM yyyy")}
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => shift(-1)}
                        className="grid h-9 w-9 place-items-center rounded-full text-neutral-text-2 hover:bg-neutral-card"
                    >
                        <ChevronLeft strokeWidth={1.75} className="h-5 w-5" />
                    </button>
                    <span className="font-display text-h3 font-medium text-neutral-ink">
                        {format(cursor, "MMMM yyyy")}
                    </span>
                    <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => shift(1)}
                        className="grid h-9 w-9 place-items-center rounded-full text-neutral-text-2 hover:bg-neutral-card"
                    >
                        <ChevronRight strokeWidth={1.75} className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 px-1 font-sans text-caption text-neutral-text-3">
                    {WEEKDAYS.map((d) => (
                        <div
                            key={d}
                            className="text-center uppercase tracking-[0.08em]"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 px-1">
                    {cells.map((cell) => {
                        const dayLocal = cell.date;
                        const inMonth = isSameMonth(dayLocal, cursor);
                        const isSelected = isSameStudioDay(
                            fromZonedTime(dayLocal, STUDIO_TZ),
                            fromZonedTime(selectedLocal, STUDIO_TZ),
                        );
                        const tooEarly = dayLocal < startOfDayLocal(minLocal);
                        const tooLate = dayLocal > startOfDayLocal(maxLocal);
                        const disabled = tooEarly || tooLate;
                        return (
                            <button
                                key={dayLocal.toISOString()}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                    onSelect(
                                        fromZonedTime(dayLocal, STUDIO_TZ),
                                    );
                                    onClose();
                                }}
                                className={cn(
                                    "relative h-10 rounded-md font-display text-body font-medium transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                                    disabled &&
                                        "cursor-not-allowed text-neutral-text-3/40",
                                    !disabled &&
                                        !isSelected &&
                                        inMonth &&
                                        "text-neutral-ink hover:bg-primary-100",
                                    !disabled &&
                                        !isSelected &&
                                        !inMonth &&
                                        "text-neutral-text-3 hover:bg-primary-100",
                                    isSelected &&
                                        "bg-primary-500 text-neutral-ink shadow-sm",
                                )}
                            >
                                {format(dayLocal, "d")}
                            </button>
                        );
                    })}
                </div>

                <p className="font-sans text-caption text-neutral-text-3">
                    Pick any date in the next two weeks of classes.
                </p>
            </div>
        </Sheet>
    );
}

function startOfDayLocal(d: Date) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

interface Cell {
    date: Date;
}

function buildMonthCells(cursor: Date): Cell[] {
    const monthStart = startOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    // Always render 6 weeks for layout stability.
    const cells: Cell[] = [];
    const day = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
        cells.push({ date: new Date(day) });
        day.setDate(day.getDate() + 1);
    }
    return cells;
}
