import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/**
 * Page horizontal gutter. LIFF viewport is narrow (~375–430px),
 * so this is just consistent left/right padding.
 */
export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-screen-sm px-4", className)}
      {...props}
    />
  );
}
