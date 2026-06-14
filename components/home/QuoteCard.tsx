import { cn } from "@/lib/cn";
import { Quote } from "lucide-react";

export interface QuoteCardProps {
    text: string;
    author?: string;
    className?: string;
}

export function QuoteCard({ text, author, className }: QuoteCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-primary-200 bg-primary-50 px-5 py-4",
                className,
            )}
        >
            <Quote
                strokeWidth={1.5}
                className="mb-2 h-5 w-5 text-primary-400"
                aria-hidden
            />
            <p className="font-display text-body-lg font-medium italic leading-relaxed text-neutral-ink">
                &ldquo;{text}&rdquo;
            </p>
            {author && (
                <p className="mt-2 font-sans text-caption text-neutral-text-2">
                    — {author}
                </p>
            )}
        </div>
    );
}
