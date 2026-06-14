import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * Selectable pill — use for filters, date strip, tag selection.
 */
export function Chip({
  selected = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full",
        "font-sans text-body font-medium transition-colors duration-150",
        "active:scale-[0.97]",
        selected
          ? "bg-primary-500 text-neutral-ink"
          : "bg-neutral-card text-neutral-text-2 border border-neutral-line hover:bg-primary-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
