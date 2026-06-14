import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-100 text-primary-700">
          {icon}
        </div>
      )}
      <div className="font-display text-h2 font-medium text-neutral-ink">
        {title}
      </div>
      {description && (
        <p className="max-w-xs font-sans text-body text-neutral-text-2">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
