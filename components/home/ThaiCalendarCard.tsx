"use client";

import { cn } from "@/lib/cn";
import { getActiveThaiFestival } from "@/lib/dates/thai-calendar";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export interface ThaiCalendarCardProps {
  displayName?: string;
  className?: string;
}

export function ThaiCalendarCard({ displayName, className }: ThaiCalendarCardProps) {
  const festival = getActiveThaiFestival();

  // Festival mode: full-bleed tiger card with a greeting.
  if (festival) {
    const card = (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-neutral-line/20 bg-neutral-card shadow-sm",
          className
        )}
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-primary-50">
          <Image
            src={festival.image}
            alt={festival.label}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-contain"
            priority
          />
        </div>
        <div className="relative bg-neutral-card p-4">
          <h2 className="font-display text-h2 font-semibold text-neutral-ink">
            {festival.label}
          </h2>
        </div>
      </motion.div>
    );

    return festival.href ? (
      <Link
        href={festival.href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {card}
      </Link>
    ) : (
      card
    );
  }

  // Fallback: warm "Sawasdee" welcome card.
  const greeting = displayName
    ? `Sawasdee, ${displayName}!`
    : "Sawasdee & Welcome!";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-line/20 bg-neutral-card shadow-sm",
        className
      )}
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-primary-50">
        <Image
          src="/mitr welcome.png"
          alt="Welcome to MiTR Journey"
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-contain"
          priority
        />
      </div>
      <div className="relative bg-neutral-card p-4">
        <h2 className="font-display text-h2 font-semibold text-neutral-ink">
          {greeting}
        </h2>
        <p className="mt-1 font-sans text-body-sm text-neutral-text-2">
          Step onto your mat, breathe deeply, and find your center today.
        </p>
      </div>
    </motion.div>
  );
}
