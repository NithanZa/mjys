"use client";

import { cn } from "@/lib/cn";
import {
  formatDayNumber,
  formatWeekday,
  isSameStudioDay,
} from "@/lib/dates";
import { useEffect, useRef } from "react";

export interface DateStripProps {
  dates: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  className?: string;
}

export function DateStrip({
  dates,
  selected,
  onSelect,
  className,
}: DateStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Center the selected pill on mount and whenever it changes.
  useEffect(() => {
    const node = selectedRef.current;
    if (!node) return;
    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selected]);

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "scrollbar-none -mx-4 flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-4",
        className,
      )}
      role="tablist"
      aria-label="Pick a date"
    >
      {dates.map((d) => {
        const isSelected = isSameStudioDay(d, selected);
        return (
          <button
            key={d.toISOString()}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(d)}
            className={cn(
              "flex h-16 w-12 shrink-0 snap-center flex-col items-center justify-center rounded-md border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              isSelected
                ? "border-primary-500 bg-primary-500 text-neutral-ink"
                : "border-transparent bg-neutral-card text-neutral-text-2 hover:border-primary-200",
            )}
          >
            <span
              className={cn(
                "font-sans text-overline uppercase tracking-[0.08em]",
                isSelected ? "text-neutral-ink" : "text-neutral-text-3",
              )}
            >
              {formatWeekday(d)}
            </span>
            <span className="font-display text-h3 font-medium leading-none">
              {formatDayNumber(d)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
