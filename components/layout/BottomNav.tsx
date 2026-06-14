"use client";

import { cn } from "@/lib/cn";
import {
    CalendarCheck,
    House,
    Tag,
    User,
    Users,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    match: (pathname: string) => boolean;
}

const items: NavItem[] = [
    { href: "/", label: "Home", icon: House, match: (p) => p === "/" },
    {
        href: "/book",
        label: "Book",
        icon: CalendarCheck,
        match: (p) => p.startsWith("/book"),
    },
    {
        href: "/promotion",
        label: "Promotion",
        icon: Tag,
        match: (p) => p.startsWith("/promotion"),
    },
    {
        href: "/about",
        label: "About",
        icon: Users,
        match: (p) => p.startsWith("/about") || p.startsWith("/instructors"),
    },
    {
        href: "/profile",
        label: "Profile",
        icon: User,
        match: (p) => p.startsWith("/profile"),
    },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Primary"
            className={cn(
                "fixed inset-x-0 bottom-0 z-30 border-t border-neutral-line bg-neutral-bg/95",
                "backdrop-blur-sm",
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <ul className="mx-auto grid max-w-screen-sm grid-cols-5">
                {items.map((item) => {
                    const active = item.match(pathname);
                    const Icon = item.icon;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 py-2.5",
                                    "transition-colors duration-150",
                                    active
                                        ? "text-primary-500"
                                        : "text-neutral-text-3 hover:text-neutral-text-2",
                                )}
                            >
                                <Icon
                                    strokeWidth={active ? 2 : 1.75}
                                    className="h-6 w-6"
                                    aria-hidden
                                />
                                <span className="font-sans text-overline font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

/** Spacer to reserve room under content so BottomNav never covers it. */
export function BottomNavSpacer() {
    return (
        <div
            aria-hidden
            style={{
                height: `calc(64px + env(safe-area-inset-bottom))`,
            }}
        />
    );
}
