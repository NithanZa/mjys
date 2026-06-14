import { cn } from "@/lib/cn";
import type { LevelInfo } from "@/lib/levels";

export interface LevelProgressProps {
  info: LevelInfo;
  classesAttended: number;
  className?: string;
}

export function LevelProgress({
  info,
  classesAttended,
  className,
}: LevelProgressProps) {
  const pct = Math.round(info.progress * 100);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between font-sans text-caption text-neutral-text-2">
        <span>{classesAttended} classes attended</span>
        {info.next ? (
          <span>
            {info.remaining} to {info.next.label}
          </span>
        ) : (
          <span className="font-medium text-primary-700">100 Club</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-card"
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
