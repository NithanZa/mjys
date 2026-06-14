import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { MilestoneStatus } from "@/lib/rewards";
import { Gift, Lock } from "lucide-react";

export interface MilestoneCardProps {
  status: MilestoneStatus;
  className?: string;
}

export function MilestoneCard({ status, className }: MilestoneCardProps) {
  const { milestone, unlocked, progress, remaining } = status;
  const pct = Math.round(progress * 100);

  return (
    <Card
      elevation="sm"
      className={cn(
        "flex flex-col gap-3",
        unlocked && "ring-1 ring-primary-200",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            unlocked
              ? "bg-primary-100 text-primary-700"
              : "bg-neutral-card text-neutral-text-3",
          )}
          aria-hidden
        >
          {unlocked ? (
            <Gift strokeWidth={1.75} className="h-5 w-5" />
          ) : (
            <Lock strokeWidth={1.75} className="h-5 w-5" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-h3 font-medium text-neutral-ink">
              {milestone.name}
            </h3>
            {unlocked && <Badge tone="primary">Unlocked</Badge>}
          </div>
          <p className="mt-0.5 font-sans text-body-sm text-neutral-text-2">
            {milestone.description}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between font-sans text-caption text-neutral-text-2">
          <span>Reward · {milestone.rewardLabel}</span>
          {unlocked ? (
            <span className="font-medium text-primary-700">Earned</span>
          ) : (
            <span>{remaining} to go</span>
          )}
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-card"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              unlocked ? "bg-primary-500" : "bg-primary-300",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
