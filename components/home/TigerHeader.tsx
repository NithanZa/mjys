"use client";

import { cn } from "@/lib/cn";
import { motion } from "motion/react";
import Image from "next/image";

export interface TigerHeaderProps {
  className?: string;
}

export function TigerHeader({ className }: TigerHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn("flex flex-col items-center text-center px-4 pt-2", className)}
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary-200 shadow-sm">
        <Image
          src="/tigers/LINE_ALBUM_tiger_260719_17.jpg"
          alt="MiTR tiger mascot"
          fill
          className="object-cover"
          priority
          sizes="48px"
        />
      </div>
      <h1 className="mt-2 font-display text-h3 font-semibold text-neutral-ink">
        MiTR Journey Yoga Studio
      </h1>
      <p className="mt-1 max-w-xs font-sans text-caption text-neutral-text-2">
        Discover the strength and soul within your everyday journey
      </p>
    </motion.header>
  );
}
