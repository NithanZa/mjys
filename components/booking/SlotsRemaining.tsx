import { cn } from "@/lib/cn";
import { Users } from "lucide-react";

export interface SlotsRemainingProps {
  slotsLeft: number;
  capacity: number;
  className?: string;
}

export function SlotsRemaining({
  slotsLeft,
  capacity,
  className,
}: SlotsRemainingProps) {
  const isFull = slotsLeft <= 0;
  const isLow = !isFull && slotsLeft <= 3;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-sans text-caption",
        isFull
          ? "text-error-fg"
          : isLow
            ? "text-warning-fg"
            : "text-neutral-text-2",
        className,
      )}
    >
      <Users strokeWidth={1.75} className="h-3.5 w-3.5" aria-hidden />
      {isFull
        ? "Full"
        : `${slotsLeft} of ${capacity} left`}
    </span>
  );
}
