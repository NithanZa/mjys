"use client";

import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { IconButton } from "./IconButton";

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Snap point as % of viewport height. Default 60. */
    height?: number;
    /** Optional title rendered in the sheet header. */
    title?: ReactNode;
    className?: string;
    desktopSidebar?: boolean;
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
    desktopSidebar = false,
}: SheetProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        const media = window.matchMedia("(min-width: 1024px)");
        const updateScrollLock = () => {
            document.body.style.overflow = desktopSidebar && media.matches ? prev : "hidden";
        };
        updateScrollLock();
        media.addEventListener("change", updateScrollLock);
        return () => {
            document.removeEventListener("keydown", onKey);
            media.removeEventListener("change", updateScrollLock);
            document.body.style.overflow = prev;
        };
    }, [open, onClose, desktopSidebar]);

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
                        className={cn(
                            "fixed inset-0 z-40 bg-neutral-ink/30 backdrop-blur-[1px]",
                            desktopSidebar && "lg:hidden",
                        )}
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
                            "fixed inset-x-0 bottom-0 z-50 h-[60dvh] bg-neutral-bg rounded-t-xl shadow-lg",
                            "flex flex-col overscroll-contain",
                            desktopSidebar && "lg:inset-y-4 lg:left-auto lg:right-4 lg:h-[calc(100dvh-2rem)] lg:rounded-xl",
                            className,
                        )}
                        style={{
                            height: desktopSidebar ? undefined : `${height}dvh`,
                            paddingBottom: "env(safe-area-inset-bottom)",
                        }}
                    >
                        <div className={cn("mx-auto mt-2 h-1 w-12 rounded-full bg-neutral-line", desktopSidebar && "lg:hidden")} />
                        {title && (
                            <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-2 font-display text-h2 font-medium text-neutral-ink lg:pt-5 lg:pb-0">
                                <div className="min-w-0">{title}</div>
                                {desktopSidebar && (
                                    <IconButton
                                        aria-label="Close"
                                        onClick={onClose}
                                        variant="ghost"
                                        size="sm"
                                        className="hidden -mr-2 -mt-1 lg:inline-flex"
                                    >
                                        <X strokeWidth={1.75} className="h-5 w-5" />
                                    </IconButton>
                                )}
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
