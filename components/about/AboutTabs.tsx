"use client";

import { cn } from "@/lib/cn";
import { MapPinIcon, UserIcon, UsersIcon, type LucideIcon } from "lucide-react";

export type AboutTab = "instructors" | "staff" | "map";

export interface AboutTabsProps {
    active: AboutTab;
    onChange: (tab: AboutTab) => void;
    className?: string;
}

interface TabDef {
    id: AboutTab;
    label: string;
    icon: LucideIcon;
}

const TABS: TabDef[] = [
    { id: "instructors", label: "Instructors", icon: UsersIcon },
    { id: "staff", label: "Staff", icon: UserIcon },
    { id: "map", label: "Map", icon: MapPinIcon },
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
                            : "border border-neutral-line bg-neutral-card text-neutral-ink hover:bg-primary-50",
                    )}
                >
                    <tab.icon className="h-4 w-4" aria-hidden />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
