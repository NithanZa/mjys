import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export interface SectionProps extends Omit<
    HTMLAttributes<HTMLElement>,
    "title"
> {
    title?: ReactNode;
    action?: ReactNode;
}

export function Section({
    title,
    action,
    className,
    children,
    ...props
}: SectionProps) {
    return (
        <section className={cn("flex flex-col gap-3", className)} {...props}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-3">
                    {title && (
                        <h2 className="font-display text-h2 font-medium text-neutral-ink">
                            {title}
                        </h2>
                    )}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
