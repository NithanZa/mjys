import { cn } from "@/lib/cn";
import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: Size;
  /** Fallback initial(s) when src is missing. */
  fallback?: string;
  className?: string;
}

const sizes: Record<Size, { box: string; px: number; text: string }> = {
  sm: { box: "h-8 w-8", px: 32, text: "text-caption" },
  md: { box: "h-10 w-10", px: 40, text: "text-body" },
  lg: { box: "h-14 w-14", px: 56, text: "text-body-lg" },
  xl: { box: "h-20 w-20", px: 80, text: "text-h2" },
};

export function Avatar({
  src,
  alt,
  size = "md",
  fallback,
  className,
}: AvatarProps) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-primary-100 text-primary-800 font-display font-medium",
        s.box,
        s.text,
        className,
      )}
      aria-label={alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={s.px}
          height={s.px}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{(fallback ?? alt).slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
