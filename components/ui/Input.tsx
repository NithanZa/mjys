import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/**
 * Bare input element with brand styling.
 * NOTE: font-size is forced to 16px in globals.css to prevent iOS focus-zoom.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-3 rounded-sm bg-neutral-card border",
        "text-neutral-text placeholder:text-neutral-text-3",
        "transition-colors duration-150",
        invalid
          ? "border-error-fg focus-visible:outline-error-fg"
          : "border-neutral-line focus-visible:outline-primary-500",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});

export interface TextFieldProps extends InputProps {
  label: string;
  hint?: string;
  errorText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, hint, errorText, leftIcon, rightIcon, id, className, ...props },
    ref,
  ) {
    const fieldId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const invalid = Boolean(errorText);
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          htmlFor={fieldId}
          className="font-sans text-caption font-medium text-neutral-text-2"
        >
          {label}
        </label>
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-text-3">
              {leftIcon}
            </span>
          )}
          <Input
            ref={ref}
            id={fieldId}
            invalid={invalid}
            className={cn(leftIcon && "pl-10", rightIcon && "pr-10")}
            aria-invalid={invalid}
            aria-describedby={
              errorText
                ? `${fieldId}-error`
                : hint
                  ? `${fieldId}-hint`
                  : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-3 flex items-center text-neutral-text-3">
              {rightIcon}
            </span>
          )}
        </div>
        {errorText ? (
          <span
            id={`${fieldId}-error`}
            className="font-sans text-caption text-error-fg"
          >
            {errorText}
          </span>
        ) : hint ? (
          <span
            id={`${fieldId}-hint`}
            className="font-sans text-caption text-neutral-text-3"
          >
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
