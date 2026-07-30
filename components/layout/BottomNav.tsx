"use client";

import { cn } from "@/lib/cn";
import { CalendarCheck, House, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LucideNavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    match: (pathname: string) => boolean;
}

interface ImageNavItem {
    href: string;
    label: string;
    image: string;
    match: (pathname: string) => boolean;
}

type NavItem = LucideNavItem | ImageNavItem;

const items: NavItem[] = [
    { href: "/", label: "Home", icon: House, match: (p) => p === "/" },
    {
        href: "/book",
        label: "Book Classes",
        icon: CalendarCheck,
        match: (p) => p.startsWith("/book"),
    },
    {
        href: "/promotion",
        label: "Promotion",
        image: "/tigers/LINE_ALBUM_tiger_260719_12.jpg",
        match: (p) => p.startsWith("/promotion"),
    },
    {
        href: "/about",
        label: "About Mitr",
        image: "/tigers/LINE_ALBUM_tiger_260719_13.jpg",
        match: (p) => p.startsWith("/about") || p.startsWith("/instructors"),
    },
    {
        href: "/profile",
        label: "Profile",
        image: "/tigers/LINE_ALBUM_tiger_260719_14.jpg",
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
                    const linkClass = cn(
                        "flex flex-col items-center justify-center gap-1 py-2.5",
                        "transition-colors duration-150",
                        active
                            ? "text-primary-500"
                            : "text-neutral-text-3 hover:text-neutral-text-2",
                    );

                    if ("icon" in item) {
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={linkClass}
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
                    }

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={linkClass}
                            >
                                <div
                                    className={cn(
                                        "relative h-6 w-6 overflow-hidden rounded-full",
                                        active && "ring-2 ring-primary-500 ring-offset-1 ring-offset-neutral-bg",
                                    )}
                                >
                                    <Image
                                        src={item.image}
                                        alt={item.label}
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                    />
                                </div>
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
