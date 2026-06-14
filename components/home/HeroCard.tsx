import { cn } from "@/lib/cn";

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
        "bg-breath relative -mx-4 overflow-hidden rounded-b-xl px-4 pt-8 pb-12",
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
        <span className="font-display text-overline uppercase tracking-[0.08em] text-primary-700">
          {eyebrow}
        </span>
        <h1 className="mt-2 font-display text-display font-semibold text-balance text-neutral-ink">
          {title}
        </h1>
        <p className="mt-3 font-display text-h3 font-medium text-primary-800">
          {subtitle}
        </p>
        <p className="mt-3 max-w-xs font-sans text-body text-neutral-text-2">
          {tagline}
        </p>
      </div>
    </section>
  );
}
