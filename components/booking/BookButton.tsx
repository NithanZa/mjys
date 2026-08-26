"use client";

import { Button } from "@/components/ui/Button";
import { Check, X } from "lucide-react";

export interface BookButtonProps {
  isBooked: boolean;
  isFull: boolean;
  onBook: () => void;
  onCancel: () => void;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

/**
 * Three states (matches Phase 3 ACs 5/6):
 *   - Full        → disabled, label "Full"
 *   - Not booked  → primary CTA "Book"
 *   - Booked      → secondary "Booked — Cancel"
 */
export function BookButton({
  isBooked,
  isFull,
  onBook,
  onCancel,
  loading = false,
  size = "md",
  fullWidth = false,
}: BookButtonProps) {
  if (loading) {
    return (
      <Button variant="secondary" size={size} fullWidth={fullWidth} disabled>
        Checking…
      </Button>
    );
  }

  if (isFull && !isBooked) {
    return (
      <Button variant="secondary" size={size} fullWidth={fullWidth} disabled>
        Full
      </Button>
    );
  }

  if (isBooked) {
    return (
      <Button
        variant="secondary"
        size={size}
        fullWidth={fullWidth}
        leftIcon={<Check strokeWidth={1.75} className="h-4 w-4" />}
        rightIcon={<X strokeWidth={1.75} className="h-4 w-4" />}
        onClick={onCancel}
      >
        Booked — Cancel
      </Button>
    );
  }

  return (
    <Button variant="primary" size={size} fullWidth={fullWidth} onClick={onBook}>
      Book
    </Button>
  );
}
