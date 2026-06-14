"use client";

import { cn } from "@/lib/cn";

export type AboutTab = "instructors" | "staff" | "map";

export interface AboutTabsProps {
    active: AboutTab;
    onChange: (tab: AboutTab) => void;
    className?: string;
}

interface TabDef {
    id: AboutTab;
    label: string;
    emoji: string;
}

const TABS: TabDef[] = [
    { id: "instructors", label: "Instructors", emoji: "🧘" },
    { id: "staff", label: "Staff", emoji: "👥" },
    { id: "map", label: "Map", emoji: "📍" },
];

export function AboutTabs({ active, onChange, className }: AboutTabsProps) {
    return (
        <div className={cn("grid grid-cols-3 gap-2", className)}>
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "flex items-center justify-center gap-1.5 rounded-full py-2.5 font-sans text-body-sm font-semibold transition-colors",
                        active === tab.id
                            ? "bg-primary-600 text-white"
                            : "border border-neutral-line bg-neutral-bg text-neutral-text-2 hover:bg-neutral-card",
                    )}
                >
                    <span aria-hidden>{tab.emoji}</span>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
