"use client";

import { cn } from "@/lib/cn";
import { motion } from "motion/react";

export interface HeroCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline: string;
  className?: string;
}

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  tagline,
  className,
}: HeroCardProps) {
  return (
    <section
      className={cn(
        "bg-breath relative overflow-hidden rounded-xl shadow-sm px-5 pt-8 pb-10",
        className,
      )}
    >
      {/* Decorative breath rings — pure CSS so we don't need an asset pass yet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary-200/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-primary-200/30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-primary-200/20"
      />

      <div className="relative">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="font-display text-overline uppercase tracking-[0.08em] text-primary-700"
        >
          {eyebrow}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-2 font-display text-display font-semibold text-balance text-neutral-ink"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
          className="mt-3 font-display text-h3 font-medium text-primary-800"
        >
          {subtitle}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          className="mt-3 max-w-xs font-sans text-body text-neutral-text-2"
        >
          {tagline}
        </motion.p>
      </div>
    </section>
  );
}
