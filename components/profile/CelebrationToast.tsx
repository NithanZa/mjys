"use client";

import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";

export interface CelebrationToastProps {
  open: boolean;
  threshold: number | null;
  message: string;
  onClose: () => void;
}

export function CelebrationToast({
  open,
  threshold,
  message,
  onClose,
}: CelebrationToastProps) {
  return (
    <AnimatePresence>
      {open && threshold !== null && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className={cn(
            "fixed inset-x-4 z-40 mx-auto max-w-screen-sm",
            "rounded-md bg-primary-500 text-neutral-ink shadow-lg",
            "flex items-center gap-3 px-4 py-3",
          )}
          style={{
            bottom: `calc(80px + env(safe-area-inset-bottom))`,
          }}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-700 text-primary-50">
            <Sparkles strokeWidth={1.75} className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex-1">
            <div className="font-display text-body-lg font-semibold">
              {threshold} classes!
            </div>
            <div className="font-sans text-caption">{message}</div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-primary-700/30 active:bg-primary-700/40"
          >
            <X strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
