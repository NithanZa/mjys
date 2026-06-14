"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { studioDaysBetween } from "@/lib/dates";
import type { ActivePackageView } from "@/lib/mock/purchases-store";
import { Infinity as InfinityIcon, Ticket } from "lucide-react";

export interface ActivePackageStripProps {
  active: ActivePackageView | null;
  className?: string;
}

export function ActivePackageStrip({
  active,
  className,
}: ActivePackageStripProps) {
  if (!active) {
    return (
      <Card elevation="sm" className={cn("flex items-center gap-3", className)}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-card text-neutral-text-3">
          <Ticket strokeWidth={1.75} className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display text-body-lg font-medium text-neutral-ink">
            No active pack
          </div>
          <p className="font-sans text-caption text-neutral-text-3">
            Grab a 10-class pack to start your journey.
          </p>
        </div>
      </Card>
    );
  }

  const daysLeft = Math.max(0, studioDaysBetween(new Date(), active.expiresAt));
  const balanceLine = active.isUnlimited
    ? "Unlimited classes"
    : `${active.classesRemaining} ${active.classesRemaining === 1 ? "class" : "classes"} left`;

  return (
    <Card elevation="sm" className={cn("flex items-center gap-3", className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700">
        {active.isUnlimited ? (
          <InfinityIcon strokeWidth={1.75} className="h-5 w-5" aria-hidden />
        ) : (
          <Ticket strokeWidth={1.75} className="h-5 w-5" aria-hidden />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
          Active pack
        </div>
        <div className="font-display text-body-lg font-medium text-neutral-ink truncate">
          {active.offer.name}
        </div>
        <p className="font-sans text-caption text-neutral-text-2">
          {balanceLine} · expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
        </p>
      </div>
    </Card>
  );
}
