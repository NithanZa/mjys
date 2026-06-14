"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatTHB, type PackageOffer } from "@/lib/mock/packages";
import { Check } from "lucide-react";
import Link from "next/link";

export interface PackageCardProps {
  offer: PackageOffer;
  className?: string;
}

export function PackageCard({ offer, className }: PackageCardProps) {
  return (
    <Card
      elevation="sm"
      className={cn(
        "flex flex-col gap-3 transition-shadow",
        offer.highlight && "ring-2 ring-primary-500",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
            {offer.tagline}
          </span>
          <h3 className="mt-0.5 font-display text-h2 font-medium text-neutral-ink">
            {offer.name}
          </h3>
        </div>
        {offer.highlight && <Badge tone="primary">Popular</Badge>}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-display text-display font-semibold text-neutral-ink">
          {formatTHB(offer.priceTHB)}
        </span>
        {offer.classCount && offer.type !== "WALK_IN" && (
          <span className="font-sans text-body-sm text-neutral-text-2">
            · {formatTHB(Math.round(offer.priceTHB / offer.classCount))}/class
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-1.5">
        {offer.perks.map((perk) => (
          <li
            key={perk}
            className="flex items-center gap-2 font-sans text-body-sm text-neutral-text-2"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700">
              <Check strokeWidth={1.75} className="h-3 w-3" aria-hidden />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <Link href={`/promotion/${offer.id}/pay`} className="mt-1">
        <Button
          variant={offer.highlight ? "primary" : "secondary"}
          fullWidth
        >
          Pay
        </Button>
      </Link>
    </Card>
  );
}
