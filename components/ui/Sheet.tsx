"use client";

import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Snap point as % of viewport height. Default 60. */
    height?: number;
    /** Optional title rendered in the sheet header. */
    title?: ReactNode;
    className?: string;
}

/**
 * Bottom sheet. Used for date pickers, payment QR, confirmation flows.
 * Closes on backdrop tap, ESC, and the close button (if a title is provided).
 */
export function Sheet({
    open,
    onClose,
    children,
    height = 60,
    title,
    className,
}: SheetProps) {
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
                <>
                    <motion.div
                        role="presentation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-neutral-ink/30 backdrop-blur-[1px]"
                        style={{ WebkitBackdropFilter: "blur(1px)" }}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 32,
                            stiffness: 320,
                        }}
                        className={cn(
                            "fixed inset-x-0 bottom-0 z-50 bg-neutral-bg rounded-t-xl shadow-lg",
                            "flex flex-col overscroll-contain",
                            className,
                        )}
                        style={{
                            height: `${height}dvh`,
                            paddingBottom: "env(safe-area-inset-bottom)",
                        }}
                    >
                        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-neutral-line" />
                        {title && (
                            <div className="px-5 pt-3 pb-2 font-display text-h2 font-medium text-neutral-ink">
                                {title}
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
