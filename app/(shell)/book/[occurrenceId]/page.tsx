"use client";

import { TopBar } from "@/components/layout";
import { BookButton, SlotsRemaining } from "@/components/booking";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui";
import { formatDateLong, formatTime } from "@/lib/dates";
import { fetchOccurrence, OccurrenceView } from "@/lib/api/classes";
import { INTENSITY_LABELS } from "@/lib/intensity";
import { useBookings } from "@/lib/api/bookings";
import { CalendarX, Clock } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

interface ClassDetailPageProps {
  params: Promise<{ occurrenceId: string }>;
}

export default function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { occurrenceId } = use(params);
  const [occurrence, setOccurrence] = useState<OccurrenceView | null>(null);
  const [loading, setLoading] = useState(true);
  const { isBooked, book, cancel } = useBookings();

  useEffect(() => {
    let cancelled = false;
    fetchOccurrence(occurrenceId)
      .then((occ) => {
        if (!cancelled) setOccurrence(occ);
      })
      .catch((err) => {
        console.error("Failed to load class occurrence:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [occurrenceId]);

  if (loading) {
    return (
      <>
        <TopBar title="Class detail" back="/book" />
        <div className="py-12 text-center font-sans text-body-sm text-neutral-text-3">
          Loading class…
        </div>
      </>
    );
  }

  if (!occurrence) {
    return (
      <>
        <TopBar title="Class detail" back="/book" />
        <EmptyState
          icon={<CalendarX strokeWidth={1.75} className="h-6 w-6" />}
          title="Class not found"
          description="This class may have been removed or rescheduled. Head back to the schedule."
        />
      </>
    );
  }

  const { name, description, tagline, intensity, instructor, startsAt, durationMin } = occurrence;
  const booked = isBooked(occurrence.id);
  const isFull = occurrence.slotsLeft <= 0;

  return (
    <>
      <TopBar title="Class detail" back="/book" />

      <div className="flex flex-col gap-4">
        {/* Hero */}
        <Card elevation="sm" className="bg-breath flex flex-col gap-3">
          <span className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
            {formatDateLong(startsAt)}
          </span>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-display font-semibold text-neutral-ink">
              {name}
            </h1>
            <Badge tone="primary">{INTENSITY_LABELS[intensity]}</Badge>
          </div>
          <p className="font-sans text-body text-neutral-text-2">
            {tagline}
          </p>
          <div className="flex items-center gap-2 font-sans text-caption text-neutral-text-2">
            <Clock strokeWidth={1.75} className="h-4 w-4" aria-hidden />
            {formatTime(startsAt)} · {durationMin} min
          </div>
        </Card>

        {/* Description */}
        <Card>
          <h2 className="font-display text-h2 font-medium text-neutral-ink">
            About this class
          </h2>
          <p className="mt-2 font-sans text-body text-neutral-text-2">
            {description}
          </p>
        </Card>

        {/* Instructor */}
        <Card>
          <h2 className="font-display text-h2 font-medium text-neutral-ink">
            Your instructor
          </h2>
          <Link
            href={`/instructors/${instructor.slug}`}
            className="mt-3 -m-2 flex items-center gap-3 rounded-md p-2 hover:bg-neutral-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Avatar size="lg" alt={instructor.name} fallback={instructor.name} />
            <div className="flex-1 min-w-0">
              <div className="font-display text-h3 font-medium text-neutral-ink">
                {instructor.name}
              </div>
              <div className="font-sans text-caption text-neutral-text-3">
                {instructor.title}
              </div>
            </div>
            <span className="font-sans text-caption font-medium text-primary-700">
              View bio →
            </span>
          </Link>
        </Card>

        {/* Slots + book CTA */}
        <Card className="flex items-center justify-between gap-3">
          <SlotsRemaining
            slotsLeft={occurrence.slotsLeft}
            capacity={occurrence.capacity}
          />
          <BookButton
            isBooked={booked}
            isFull={isFull}
            onBook={() => book(occurrence.id)}
            onCancel={() => cancel(occurrence.id)}
            size="md"
          />
        </Card>
      </div>
    </>
  );
}
