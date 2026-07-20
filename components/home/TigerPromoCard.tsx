"use client";

import { cn } from "@/lib/cn";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export interface TigerPromoCardProps {
  href: string;
  title: string;
  image: string;
  /** Optional small caption like "Promotion" or "contact us". */
  eyebrow?: string;
  className?: string;
  /** Optional object-position override for tricky crops. */
  objectPosition?: string;
}

export function TigerPromoCard({
  href,
  title,
  image,
  eyebrow,
  className,
  objectPosition = "center",
}: TigerPromoCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block overflow-hidden rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        className
      )}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden bg-neutral-card"
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-primary-50">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition }}
          />
        </div>
        <div className="relative bg-neutral-card p-4">
          {eyebrow && (
            <span className="block font-sans text-overline uppercase tracking-wider text-neutral-text-3">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-h2 font-semibold text-neutral-ink">
            {title}
          </h2>
        </div>
      </motion.div>
    </Link>
  );
}
