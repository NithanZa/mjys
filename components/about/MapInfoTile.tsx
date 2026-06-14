import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface MapInfoTileProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    className?: string;
}

export function MapInfoTile({ icon, label, children, className }: MapInfoTileProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-1.5 rounded-xl border border-neutral-line bg-neutral-card p-3",
                className,
            )}
        >
            <span className="text-lg" aria-hidden>
                {icon}
            </span>
            <p className="font-sans text-caption text-neutral-text-2">{label}</p>
            <div className="font-sans text-body-sm text-neutral-ink">{children}</div>
        </div>
    );
}
