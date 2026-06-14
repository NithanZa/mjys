import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "ghost" | "filled" | "outline";
type Size = "sm" | "md" | "lg";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Required for a11y — icons have no text. */
  "aria-label": string;
  children: ReactNode;
}

const sizes: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const variants: Record<Variant, string> = {
  ghost:
    "bg-transparent text-neutral-text hover:bg-primary-50 active:bg-primary-100",
  filled:
    "bg-neutral-card text-primary-700 hover:bg-primary-50 active:bg-primary-100",
  outline:
    "bg-transparent text-primary-700 border border-neutral-line " +
    "hover:bg-primary-50 active:bg-primary-100",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = "ghost", size = "md", className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors duration-150",
          "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.96]",
          sizes[size],
          variants[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
