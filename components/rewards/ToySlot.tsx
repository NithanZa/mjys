import { cn } from "@/lib/cn";
import type { ToyPart, ToyPartIcon } from "@/lib/mock/rewards";
import {
    Cat,
    Flame,
    Heart,
    Leaf,
    Lock,
    Moon,
    PawPrint,
    Star,
    Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<ToyPartIcon, LucideIcon> = {
    "tiger-head": Cat,
    heart: Heart,
    paw: PawPrint,
    leaf: Leaf,
    flame: Flame,
    moon: Moon,
    sun: Sun,
    star: Star,
};

export interface ToySlotProps {
    part: ToyPart;
    earned: boolean;
    className?: string;
}

export function ToySlot({ part, earned, className }: ToySlotProps) {
    const Icon = earned ? ICONS[part.icon] : Lock;

    return (
        <div
            className={cn(
                "flex flex-col items-center gap-1.5 text-center",
                className,
            )}
        >
            <div
                className={cn(
                    "grid h-16 w-16 place-items-center rounded-md border transition-colors",
                    earned
                        ? "border-primary-200 bg-primary-100 text-primary-700"
                        : "border-dashed border-neutral-line bg-neutral-card text-neutral-text-3",
                )}
                aria-hidden
            >
                <Icon strokeWidth={1.75} className="h-7 w-7" />
            </div>
            <span
                className={cn(
                    "font-sans text-caption",
                    earned ? "text-neutral-ink" : "text-neutral-text-3",
                )}
            >
                {part.name}
            </span>
            <span className="font-sans text-overline uppercase tracking-[0.08em] text-neutral-text-3">
                {earned
                    ? "Earned"
                    : `${part.earnAt} ${part.earnAt === 1 ? "class" : "classes"}`}
            </span>
        </div>
    );
}
