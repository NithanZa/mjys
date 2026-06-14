import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-card text-neutral-text-2 border border-neutral-line",
  primary: "bg-primary-100 text-primary-800",
  accent: "bg-accent-100 text-accent-800",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  error: "bg-error-bg text-error-fg",
  info: "bg-info-bg text-info-fg",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "font-sans text-caption font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
