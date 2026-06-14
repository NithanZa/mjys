"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Milestone } from "@/lib/mock/rewards";
import { Gift, X } from "lucide-react";
import Link from "next/link";

export interface MilestoneCelebrationCardProps {
  milestone: Milestone;
  onDismiss: () => void;
}

export function MilestoneCelebrationCard({
  milestone,
  onDismiss,
}: MilestoneCelebrationCardProps) {
  return (
    <Card
      elevation="sm"
      className="bg-primary-100/70 ring-1 ring-primary-200 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500 text-neutral-ink"
          aria-hidden
        >
          <Gift strokeWidth={1.75} className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
                Milestone unlocked
              </span>
              <h3 className="mt-0.5 font-display text-h2 font-medium text-neutral-ink">
                {milestone.name}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Dismiss milestone"
              onClick={onDismiss}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-text-3 hover:bg-primary-200/40"
            >
              <X strokeWidth={1.75} className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 font-sans text-body-sm text-neutral-text-2">
            {milestone.description}
          </p>
          <p className="mt-2 font-sans text-body-sm font-medium text-primary-800">
            🎁 {milestone.rewardLabel}
          </p>
        </div>
      </div>
      <Link href={milestone.ctaHref} className="block">
        <Button variant="primary" fullWidth onClick={onDismiss}>
          {milestone.ctaLabel}
        </Button>
      </Link>
    </Card>
  );
}
