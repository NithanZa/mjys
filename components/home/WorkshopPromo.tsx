"use client";

import { cn } from "@/lib/cn";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Sparkles } from "lucide-react";

export interface WorkshopPromoProps {
  className?: string;
}

export function WorkshopPromo({ className }: WorkshopPromoProps) {
  return (
    <Link
      href="/book/occ_2026-06-28_0"
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "overflow-hidden rounded-xl border border-accent-200 bg-accent-50 shadow-sm",
          "active:scale-[0.99] cursor-pointer",
          className
        )}
      >
        <div className="relative h-56 sm:h-64 w-full bg-accent-100">
          <Image
            src="/2026_0628 workshop kruEX line.png"
            alt="Kru EX Inversion Workshop"
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            style={{ objectFit: "cover", objectPosition: "center" }}
            className="object-cover object-center"
            priority
          />
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-sans font-semibold uppercase tracking-[0.05em] text-neutral-ink shadow-xs">
            <Sparkles className="h-3 w-3" strokeWidth={2.5} />
            Special Workshop
          </div>
        </div>

        <div className="p-4 bg-white">
          <span className="font-sans text-caption font-semibold uppercase tracking-[0.08em] text-accent-700">
            Kru EX · Masterclass
          </span>
          <h3 className="mt-1 font-display text-h2 font-semibold text-neutral-ink">
            Inversion & Arm Balance Workshop
          </h3>
          <p className="mt-1.5 font-sans text-body-sm text-neutral-text-2 leading-relaxed">
            A comprehensive 3-hour masterclass breaking down headstands, forearm stands, and handstands with safe, step-by-step progressions.
          </p>

          <div className="mt-4 flex flex-col gap-2 border-t border-accent-100/50 pt-3">
            <div className="flex items-center gap-2 font-sans text-caption text-neutral-text-2">
              <Calendar className="h-4 w-4 text-accent-600" strokeWidth={1.75} />
              Sunday, June 28, 2026
            </div>
            <div className="flex items-center gap-2 font-sans text-caption text-neutral-text-2">
              <Clock className="h-4 w-4 text-accent-600" strokeWidth={1.75} />
              9:00 AM - 12:00 PM (180 mins)
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center rounded-lg bg-accent-600 py-2.5 text-center font-display text-body-sm font-semibold text-white hover:bg-accent-700 transition-colors">
            Reserve your spot
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
