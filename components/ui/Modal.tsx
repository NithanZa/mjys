"use client";

import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

/**
 * Centered modal. Prefer Sheet on mobile; use Modal for short confirmations.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "sm",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-neutral-ink/40 px-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-full bg-neutral-bg rounded-lg shadow-lg p-5 max-h-[90vh] overflow-y-auto",
              sizeClasses[size],
              className,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {title && (
                <div className="font-display text-h2 font-medium text-neutral-ink">
                  {title}
                </div>
              )}
              <IconButton
                aria-label="Close"
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="-mr-2 -mt-2"
              >
                <X strokeWidth={1.75} className="h-5 w-5" />
              </IconButton>
            </div>
            <div className="mt-3">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
