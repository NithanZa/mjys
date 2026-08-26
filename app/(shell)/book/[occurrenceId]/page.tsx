"use client";

import { TopBar } from "@/components/layout";
import { BookButton, PaidSpecialClassContactModal, SlotsRemaining } from "@/components/booking";
import { Avatar, Badge, Button, Card, EmptyState } from "@/components/ui";
import { formatDateLong, formatTime } from "@/lib/dates";
import { fetchOccurrence, OccurrenceView } from "@/lib/api/classes";
import { INTENSITY_LABELS } from "@/lib/intensity";
import { useBookings } from "@/lib/api/bookings";
import { useSpecialAdmission } from "@/lib/api/special-purchases";
import { clearScheduleSnapshot } from "@/lib/cache/client-schedule";
import { CalendarX, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

interface ClassDetailPageProps {
  params: Promise<{ occurrenceId: string }>;
}

export default function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { occurrenceId } = use(params);
  const [occurrence, setOccurrence] = useState<OccurrenceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const {
    isBooked,
    isPaidSpecialBooking,
    book,
    cancel,
    loading: bookingsLoading,
  } = useBookings();
  const { admission } = useSpecialAdmission(occurrence?.isSpecial ? occurrenceId : null);

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

  const refreshOccurrence = async () => {
    clearScheduleSnapshot();
    try {
      setOccurrence(await fetchOccurrence(occurrenceId));
    } catch (error) {
      console.error("Failed to refresh class availability:", error);
    }
  };

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

  const { name, description, tagline, intensity, instructor, startsAt, durationMin, isSpecial, specialPriceTHB } = occurrence;
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
          {isSpecial && specialPriceTHB && (
            <div className="flex items-center gap-2 font-sans text-body-sm font-medium text-primary-700">
              <Sparkles className="h-4 w-4" aria-hidden />
              Special class · ฿{specialPriceTHB.toLocaleString()}
            </div>
          )}
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
        <Card className="flex flex-col gap-3">
          {isSpecial && !booked && (
            <div className="rounded-sm bg-primary-50 border border-primary-200 p-3 font-sans text-body-sm text-neutral-text-2">
              {admission.status === "PENDING" &&
                "Your payment is awaiting studio approval. Once approved, your spot will be booked automatically."}
              {admission.status === "REJECTED" &&
                (admission.rejectionReason
                  ? `Your last payment was rejected: ${admission.rejectionReason}`
                  : "Your last payment was rejected. Please submit a new slip.")}
              {admission.status === "APPROVED" &&
                "Your payment was approved and your spot is reserved."}
              {admission.status === "NONE" &&
                "This special class is purchased separately and cannot use your class pack."}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <SlotsRemaining
              slotsLeft={occurrence.slotsLeft}
              capacity={occurrence.capacity}
            />
            {isSpecial && !booked && !isFull && admission.status !== "APPROVED" ? (
              admission.status === "PENDING" ? (
                <Button size="md" variant="primary" disabled>
                  Awaiting slip approval
                </Button>
              ) : (
                <Link href={`/book/${occurrence.id}/pay`}>
                  <Button size="md" variant="primary">
                    {admission.status === "REJECTED"
                      ? "Submit a new slip"
                      : `Pay to reserve · ฿${specialPriceTHB?.toLocaleString()}`}
                  </Button>
                </Link>
              )
            ) : (
              <BookButton
                isBooked={booked}
                isFull={isFull}
                loading={bookingsLoading}
                onBook={async () => {
                  await book(occurrence.id);
                  await refreshOccurrence();
                }}
                onCancel={async () => {
                  if (isPaidSpecialBooking(occurrence.id)) {
                    setContactModalOpen(true);
                    return;
                  }
                  await cancel(occurrence.id);
                  await refreshOccurrence();
                }}
                size="md"
              />
            )}
          </div>
        </Card>
      </div>
      <PaidSpecialClassContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        className={occurrence.name}
      />
    </>
  );
}
