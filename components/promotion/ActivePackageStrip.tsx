"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { Ticket } from "lucide-react";

export interface RemainingClassesStripProps {
  remainingClasses: number;
  nextExpiry: {
    classesRemaining: number;
    expiresAt: Date;
  } | null;
  className?: string;
}

export function RemainingClassesStrip({
  remainingClasses,
  nextExpiry,
  className,
}: RemainingClassesStripProps) {
  const balanceLine = `${remainingClasses} ${remainingClasses === 1 ? "class" : "classes"} left`;
  const expiryLine = nextExpiry
    ? `${nextExpiry.classesRemaining} ${nextExpiry.classesRemaining === 1 ? "class expires" : "classes expire"} on ${nextExpiry.expiresAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : "Buy a pack to book your next class.";

  return (
    <Card elevation="sm" className={cn("flex items-center gap-3", className)}>
      <span className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full",
        remainingClasses > 0
          ? "bg-primary-100 text-primary-700"
          : "bg-neutral-card text-neutral-text-3",
      )}>
        <Ticket strokeWidth={1.75} className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
          Class balance
        </div>
        <div className="font-display text-body-lg font-medium text-neutral-ink">
          {balanceLine}
        </div>
        <p className="font-sans text-caption text-neutral-text-2">
          {expiryLine}
        </p>
      </div>
    </Card>
  );
}
