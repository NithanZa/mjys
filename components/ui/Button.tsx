import { cn } from "@/lib/cn";
import { Loader } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium select-none whitespace-nowrap " +
  "transition-colors duration-150 ease-out " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-neutral-ink hover:bg-primary-400 active:bg-primary-600",
  secondary:
    "bg-neutral-card text-primary-700 border border-neutral-line " +
    "hover:bg-primary-50 active:bg-primary-100",
  ghost:
    "bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100",
  destructive:
    "bg-error-bg text-error-fg hover:opacity-90 active:opacity-80",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-body rounded-sm",
  md: "h-11 px-4 text-body-lg rounded-sm",
  lg: "h-12 px-5 text-body-lg rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
