"use client";

import { cn } from "@/lib/cn";
import { motion } from "motion/react";
import Image from "next/image";

export interface WelcomeBannerProps {
  displayName?: string;
  className?: string;
}

export function WelcomeBanner({ displayName, className }: WelcomeBannerProps) {
  const greeting = displayName ? `Sawasdee, ${displayName}!` : "Sawasdee & Welcome!";

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
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-primary-50">
        <Image
          src="/mitr welcome.png"
          alt="Welcome to MiTR Journey"
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-card via-transparent to-transparent opacity-80" />
      </div>
      <div className="p-4 bg-neutral-card relative">
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
