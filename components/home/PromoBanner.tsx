import { Card } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export interface PromoBannerProps {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

export function PromoBanner({
  eyebrow,
  title,
  body,
  href,
  cta,
}: PromoBannerProps) {
  return (
    <Link
      href={href}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Card
        elevation="sm"
        interactive
        className="bg-primary-100/60 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <span className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
            {eyebrow}
          </span>
          <h3 className="mt-1 font-display text-h2 font-medium text-neutral-ink">
            {title}
          </h3>
          <p className="mt-1 font-sans text-body-sm text-neutral-text-2">
            {body}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-sans text-caption font-medium text-primary-700">
          {cta}
          <ArrowRight strokeWidth={1.75} className="h-4 w-4" aria-hidden />
        </span>
      </Card>
    </Link>
  );
}
