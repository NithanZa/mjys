"use client";

import { cn } from "@/lib/cn";

export interface ClassCountSliderProps {
    value: number;
    onChange: (value: number) => void;
    max?: number;
    className?: string;
}

export function ClassCountSlider({
    value,
    onChange,
    max = 120,
    className,
}: ClassCountSliderProps) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <label className="font-sans text-caption font-medium text-neutral-text-2">
                Adjust class count
            </label>
            <div className="flex items-center gap-3">
                <input
                    type="range"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer accent-primary-600"
                />
                <span className="w-8 text-right font-sans text-body font-semibold text-primary-600">
                    {value}
                </span>
            </div>
        </div>
    );
}
