import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-primary-100/70",
        className,
      )}
      {...props}
    />
  );
}
