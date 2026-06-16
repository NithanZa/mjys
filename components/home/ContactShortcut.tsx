"use client";

import { cn } from "@/lib/cn";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export interface ContactShortcutProps {
  href?: string;
}

export function ContactShortcut({ href = "/contact" }: ContactShortcutProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-neutral-card rounded-xl p-4 shadow-sm",
          "flex items-center gap-3 cursor-pointer",
          "active:scale-[0.99]"
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-800">
          <MessageCircle strokeWidth={1.75} className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-h3 font-medium text-neutral-ink">
            Questions? Talk to us.
          </h3>
          <p className="font-sans text-body-sm text-neutral-text-2">
            LINE OA, phone, or come visit the studio.
          </p>
        </div>
        <ArrowRight
          strokeWidth={1.75}
          className="h-5 w-5 shrink-0 text-neutral-text-3"
          aria-hidden
        />
      </motion.div>
    </Link>
  );
}
