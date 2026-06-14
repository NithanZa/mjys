import { cn } from "@/lib/cn";
import type { ElementType, HTMLAttributes } from "react";

type AsProp<T extends ElementType> = {
  as?: T;
} & HTMLAttributes<HTMLElement>;

/** Mitr 600, 40/48 — launch hero. */
export function DisplayLarge<T extends ElementType = "h1">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag
      className={cn(
        "font-display text-display-lg font-semibold tracking-tight text-neutral-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Mitr 600, 32/40 — page hero. */
export function Display<T extends ElementType = "h1">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag
      className={cn(
        "font-display text-display font-semibold tracking-tight text-neutral-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Mitr 600, 24/32 — section title. */
export function H1<T extends ElementType = "h1">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag
      className={cn(
        "font-display text-h1 font-semibold text-neutral-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Mitr 500, 20/28 — card / sub-section. */
export function H2<T extends ElementType = "h2">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "h2") as ElementType;
  return (
    <Tag
      className={cn(
        "font-display text-h2 font-medium text-neutral-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Noto Sans Thai 600, 18/26 — list heading. */
export function H3<T extends ElementType = "h3">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "h3") as ElementType;
  return (
    <Tag
      className={cn(
        "font-sans text-h3 font-semibold text-neutral-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Noto Sans Thai 400, 16/24 — primary body. */
export function Body<T extends ElementType = "p">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag
      className={cn(
        "font-sans text-body-lg text-neutral-text",
        className,
      )}
      {...props}
    />
  );
}

/** Noto Sans Thai 400, 14/22 — default UI text. */
export function BodySmall<T extends ElementType = "p">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag
      className={cn("font-sans text-body text-neutral-text", className)}
      {...props}
    />
  );
}

/** Noto Sans Thai 500, 12/18 — meta / timestamps. */
export function Caption<T extends ElementType = "span">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={cn(
        "font-sans text-caption font-medium text-neutral-text-2",
        className,
      )}
      {...props}
    />
  );
}

/** Mitr 500, 11/16 ALL CAPS — eyebrows. */
export function Overline<T extends ElementType = "span">({
  as,
  className,
  ...props
}: AsProp<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={cn(
        "font-display text-overline font-medium uppercase tracking-[0.08em] text-neutral-text-2",
        className,
      )}
      {...props}
    />
  );
}
