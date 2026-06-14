import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Elevation = "flat" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  interactive?: boolean;
}

const elevations: Record<Elevation, string> = {
  flat: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export function Card({
  elevation = "md",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-neutral-card rounded-md p-4",
        elevations[elevation],
        interactive &&
          "transition-transform duration-150 active:scale-[0.99] cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)} {...props} />
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-end gap-2 pt-3 border-t border-neutral-line",
        className,
      )}
      {...props}
    />
  );
}
