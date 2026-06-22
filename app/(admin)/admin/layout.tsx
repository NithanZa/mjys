"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
    Calendar,
    Scan,
    FileCheck,
    Users,
    Tag,
    LogOut,
    Menu,
    X,
    User,
    CheckCircle2,
    Shield,
} from "lucide-react";

interface AdminSidebarProps {
    className?: string;
    onClose?: () => void;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Close mobile sidebar on navigation
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Don't show sidebar on the login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    async function handleLogout() {
        if (!confirm("Are you sure you want to log out?")) return;
        try {
            const res = await fetch("/api/admin/auth/logout", { method: "POST" });
            if (res.ok) {
                router.push("/admin/login");
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    const navigation = [
        { name: "QR Scanner", href: "/admin/scanner", icon: Scan },
        { name: "Schedule Calendar", href: "/admin/calendar", icon: Calendar },
        { name: "Slip Approvals", href: "/admin/slips", icon: FileCheck },
        { name: "Pricing & Packs", href: "/admin/pricing", icon: Tag },
        { name: "Members Directory", href: "/admin/members", icon: Users },
    ];

    return (
        <div className="flex h-screen bg-neutral-bg font-sans antialiased text-neutral-ink overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-neutral-line bg-neutral-card">
                <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center justify-between px-6 pb-5 border-b border-neutral-line">
                        <Link href="/admin" className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500 text-neutral-ink font-semibold shadow-sm">
                                <Shield className="h-4 w-4" />
                            </span>
                            <div className="flex flex-col">
                                <span className="font-display text-body font-semibold tracking-wide leading-tight">
                                    MiTR Yoga
                                </span>
                                <span className="font-sans text-caption text-neutral-text-3 font-medium">
                                    Studio Admin
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="mt-6 flex-grow flex flex-col">
                        <nav className="flex-1 px-4 space-y-1.5">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm font-medium transition-all duration-150",
                                            isActive
                                                ? "bg-primary-500 text-neutral-ink font-semibold"
                                                : "text-neutral-text-2 hover:bg-primary-50 hover:text-primary-700",
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 shrink-0 transition-colors",
                                                isActive
                                                    ? "text-neutral-ink"
                                                    : "text-neutral-text-3 group-hover:text-primary-700",
                                            )}
                                            strokeWidth={isActive ? 2 : 1.75}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex-shrink-0 flex border-t border-neutral-line p-4">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm font-medium text-error-fg hover:bg-error-bg/20 transition-all duration-150"
                        >
                            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="flex flex-col w-full md:pl-64 h-full overflow-hidden">
                <header className="flex md:hidden items-center justify-between h-14 border-b border-neutral-line bg-neutral-card px-4 shrink-0">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="grid h-10 w-10 place-items-center text-neutral-text-2 rounded-md hover:bg-neutral-line/20"
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link href="/admin" className="font-display text-body font-semibold">
                        MiTR Yoga Admin
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="grid h-10 w-10 place-items-center text-error-fg rounded-md hover:bg-error-bg/10"
                        aria-label="Log out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </header>

                {/* Mobile Drawer Backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-neutral-ink/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Mobile Drawer Menu */}
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-neutral-card border-r border-neutral-line transition-transform duration-300 ease-out md:hidden",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full",
                    )}
                >
                    <div className="flex items-center justify-between h-14 border-b border-neutral-line px-4">
                        <span className="font-display font-semibold">Admin Panel</span>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="grid h-9 w-9 place-items-center rounded-md hover:bg-neutral-line/20"
                            aria-label="Close sidebar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm font-medium transition-all duration-150",
                                        isActive
                                            ? "bg-primary-500 text-neutral-ink font-semibold"
                                            : "text-neutral-text-2 hover:bg-primary-50 hover:text-primary-700",
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="border-t border-neutral-line p-4">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm font-medium text-error-fg hover:bg-error-bg/20 transition-all duration-150"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative focus:outline-none bg-neutral-bg">
                    {children}
                </main>
            </div>
        </div>
    );
}
