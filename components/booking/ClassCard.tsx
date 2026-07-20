"use client";

import { BookButton } from "@/components/booking/BookButton";
import { SlotsRemaining } from "@/components/booking/SlotsRemaining";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/dates";
import type { OccurrenceView } from "@/lib/mock/schedule";
import Link from "next/link";

export interface ClassCardProps {
  occurrence: OccurrenceView;
  isBooked: boolean;
  onBook: () => void;
  onCancel: () => void;
  className?: string;
}

const intensityTone: Record<
  OccurrenceView["intensity"],
  "neutral" | "accent" | "primary"
> = {
  Gentle: "accent",
  Balanced: "primary",
  Strong: "neutral",
};

export function ClassCard({
  occurrence,
  isBooked,
  onBook,
  onCancel,
  className,
}: ClassCardProps) {
  const isFull = occurrence.slotsLeft <= 0;
  const { name, intensity, tagline, instructor, startsAt, durationMin } = occurrence;

  return (
    <Card elevation="sm" className={cn("flex flex-col gap-3", className)}>
      {/* Whole upper region links to detail. The action area below is its own click target. */}
      <Link
        href={`/book/${occurrence.id}`}
        className="flex flex-col gap-3 -m-4 p-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
              {formatTime(startsAt)} · {durationMin} min
            </span>
            <h3 className="mt-0.5 font-display text-h2 font-medium text-neutral-ink">
              {name}
            </h3>
          </div>
          <Badge tone={intensityTone[intensity]}>{intensity}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Avatar size="sm" alt={instructor.name} fallback={instructor.name} />
          <div className="flex flex-col">
            <span className="font-sans text-body-sm font-medium text-neutral-ink">
              {instructor.name}
            </span>
            <span className="font-sans text-caption text-neutral-text-3">
              {instructor.title}
            </span>
          </div>
        </div>

        <p className="font-sans text-body-sm text-neutral-text-2 line-clamp-2">
          {tagline}
        </p>
      </Link>

      <div className="flex items-center justify-between gap-3 pt-1">
        <SlotsRemaining
          slotsLeft={occurrence.slotsLeft}
          capacity={occurrence.capacity}
        />
        <BookButton
          isBooked={isBooked}
          isFull={isFull}
          onBook={onBook}
          onCancel={onCancel}
          size="sm"
        />
      </div>
    </Card>
  );
}
