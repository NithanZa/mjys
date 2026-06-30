"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/dates";
import type { ActivityItem, ActivityStatus } from "@/lib/profile/use-class-history";
import { format } from "date-fns";

export interface RecentActivityListProps {
  items: ActivityItem[];
  emptyHint?: string;
  className?: string;
}

const statusTone: Record<ActivityStatus, "primary" | "neutral" | "accent"> = {
  ATTENDED: "primary",
  BOOKED: "accent",
  CANCELLED: "neutral",
  NO_SHOW: "neutral",
};

const statusLabel: Record<ActivityStatus, string> = {
  ATTENDED: "Attended",
  BOOKED: "Upcoming",
  CANCELLED: "Cancelled",
  NO_SHOW: "Missed",
};

export function RecentActivityList({
  items,
  emptyHint = "No classes attended yet. Book your first one!",
  className,
}: RecentActivityListProps) {
  if (items.length === 0) {
    return (
      <Card elevation="sm" className={cn("py-4", className)}>
        <p className="font-sans text-body-sm text-neutral-text-2">{emptyHint}</p>
      </Card>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <Card elevation="sm" className="flex items-center gap-3">
            <Avatar
              size="sm"
              alt={item.instructor.name}
              fallback={item.instructor.name}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate font-display text-body-lg font-medium text-neutral-ink">
                  {item.template.name}
                </h4>
                <Badge tone={statusTone[item.status]}>
                  {statusLabel[item.status]}
                </Badge>
              </div>
              <p className="font-sans text-caption text-neutral-text-2 truncate">
                {format(item.occurredAt, "EEE, d MMM")} · {formatTime(item.occurredAt)} · {item.instructor.name}
              </p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
