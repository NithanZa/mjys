import { cn } from "@/lib/cn";
import type { Level } from "@/lib/levels";
import { Sparkles } from "lucide-react";

export interface LevelBadgeProps {
  level: Level;
  label: string;
  isCentury?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tones: Record<Level, string> = {
  CAT: "bg-accent-100 text-accent-800 border-accent-200",
  TIGER: "bg-primary-100 text-primary-800 border-primary-200",
  LEOPARD: "bg-primary-500 text-neutral-ink border-primary-700",
};

const sizes = {
  sm: "h-6 px-2 text-caption",
  md: "h-7 px-3 text-body",
  lg: "h-9 px-4 text-body-lg",
};

export function LevelBadge({
  level,
  label,
  isCentury = false,
  size = "md",
  className,
}: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-display font-medium",
        tones[level],
        sizes[size],
        className,
      )}
    >
      {isCentury && (
        <Sparkles strokeWidth={1.75} className="h-4 w-4" aria-hidden />
      )}
      {label}
    </span>
  );
}
