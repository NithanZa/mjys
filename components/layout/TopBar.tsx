"use client";

import { cn } from "@/lib/cn";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";

export interface TopBarProps {
  title?: ReactNode;
  /** Show a back button. If true, uses router.back(). Or pass a custom href. */
  back?: boolean | string;
  right?: ReactNode;
  className?: string;
  /** Apply the brand "Breath" gradient as background — for hero pages. */
  hero?: boolean;
}

export function TopBar({
  title,
  back = false,
  right,
  className,
  hero = false,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 w-full",
        hero ? "bg-breath" : "bg-neutral-bg/95 backdrop-blur-sm",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-screen-sm items-center gap-2 px-4">
        {back ? (
          <IconButton
            aria-label="Back"
            variant="ghost"
            onClick={() => {
              if (typeof back === "string") {
                router.push(back);
              } else {
                router.back();
              }
            }}
          >
            <ChevronLeft strokeWidth={1.75} className="h-6 w-6" />
          </IconButton>
        ) : (
          <span aria-hidden className="w-10" />
        )}
        <div className="flex-1 truncate text-center font-display text-h2 font-medium text-neutral-ink">
          {title}
        </div>
        <div className="flex w-10 items-center justify-end">{right}</div>
      </div>
    </header>
  );
}
