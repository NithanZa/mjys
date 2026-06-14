import { cn } from "@/lib/cn";
import type { CSSProperties, HTMLAttributes } from "react";

type Edge = "top" | "bottom" | "left" | "right";

export interface SafeAreaProps extends HTMLAttributes<HTMLDivElement> {
  edges?: Edge[];
}

/**
 * Adds padding from env(safe-area-inset-*) on the chosen edges.
 * Use around fixed bars (TopBar, BottomNav) that sit at the screen edge.
 */
export function SafeArea({
  edges = ["top", "bottom", "left", "right"],
  className,
  style,
  ...props
}: SafeAreaProps) {
  const safeStyle: CSSProperties = {
    paddingTop: edges.includes("top") ? "env(safe-area-inset-top)" : undefined,
    paddingBottom: edges.includes("bottom")
      ? "env(safe-area-inset-bottom)"
      : undefined,
    paddingLeft: edges.includes("left")
      ? "env(safe-area-inset-left)"
      : undefined,
    paddingRight: edges.includes("right")
      ? "env(safe-area-inset-right)"
      : undefined,
    ...style,
  };
  return <div className={cn(className)} style={safeStyle} {...props} />;
}
