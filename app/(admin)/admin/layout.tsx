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
    PanelLeftClose,
    PanelLeftOpen,
    Shield,
    UserCog,
    Image as ImageIcon,
} from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
    const [desktopSidebarHovered, setDesktopSidebarHovered] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const desktopSidebarExpanded = !desktopSidebarCollapsed || desktopSidebarHovered;

    // Close mobile sidebar on navigation
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Don't show sidebar on the login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    function toggleDesktopSidebar() {
        if (!desktopSidebarCollapsed) setDesktopSidebarHovered(false);
        setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
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
        { name: "Home Banners", href: "/admin/banners", icon: ImageIcon },
        { name: "Schedule Calendar", href: "/admin/calendar", icon: Calendar },
        { name: "Pricing & Packs", href: "/admin/pricing", icon: Tag },
        { name: "Slip Approvals", href: "/admin/slips", icon: FileCheck },
        { name: "Staff Directory", href: "/admin/staff", icon: UserCog },
        { name: "Members Directory", href: "/admin/members", icon: Users },
        { name: "QR Scanner", href: "/admin/scanner", icon: Scan },
    ];

    return (
        <div className="flex h-screen bg-neutral-bg font-sans antialiased text-neutral-ink overflow-hidden">
            {/* Sidebar Desktop */}
            <aside
                className={cn(
                    "hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-neutral-line bg-neutral-card transition-[width] duration-200 ease-in-out",
                    desktopSidebarExpanded ? "md:w-64" : "md:w-20",
                )}
                onMouseEnter={() => setDesktopSidebarHovered(true)}
                onMouseMove={() => {
                    if (desktopSidebarCollapsed && !desktopSidebarHovered) setDesktopSidebarHovered(true);
                }}
                onMouseLeave={() => setDesktopSidebarHovered(false)}
            >
                <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
                    <div
                        className={cn(
                            "flex items-center pb-5 border-b border-neutral-line",
                            desktopSidebarExpanded ? "justify-between px-6" : "justify-center px-3",
                        )}
                    >
                        <Link
                            href="/admin"
                            className="flex items-center gap-2.5"
                            aria-label="MiTR Yoga Studio Admin"
                            title={desktopSidebarExpanded ? undefined : "MiTR Yoga Studio Admin"}
                        >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-500 text-neutral-ink font-semibold shadow-sm">
                                <Shield className="h-4 w-4" />
                            </span>
                            {desktopSidebarExpanded && (
                                <div className="flex flex-col">
                                    <span className="font-display text-body font-semibold tracking-wide leading-tight">
                                        MiTR Yoga
                                    </span>
                                    <span className="font-sans text-caption text-neutral-text-3 font-medium">
                                        Studio Admin
                                    </span>
                                </div>
                            )}
                        </Link>
                        <button
                            type="button"
                            onClick={toggleDesktopSidebar}
                            className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-text-2 hover:bg-neutral-line/20 hover:text-neutral-ink",
                                !desktopSidebarExpanded && "absolute -right-4 top-5 border border-neutral-line bg-neutral-card shadow-sm",
                            )}
                            aria-label={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            title={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {desktopSidebarCollapsed ? (
                                <PanelLeftOpen className="h-4 w-4" />
                            ) : (
                                <PanelLeftClose className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <div className="mt-6 flex-grow flex flex-col">
                        <nav className={cn("flex-1 space-y-1.5", desktopSidebarExpanded ? "px-4" : "px-3")}>
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center rounded-sm py-2.5 text-body-sm font-medium transition-all duration-150",
                                            desktopSidebarExpanded ? "gap-3 px-3" : "justify-center px-0",
                                            isActive
                                                ? "bg-primary-500 text-neutral-ink font-semibold"
                                                : "text-neutral-text-2 hover:bg-primary-50 hover:text-primary-700",
                                        )}
                                        title={desktopSidebarExpanded ? undefined : item.name}
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
                                        {desktopSidebarExpanded && item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className={cn("flex-shrink-0 flex border-t border-neutral-line p-4", !desktopSidebarExpanded && "px-3")}>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className={cn(
                                "group flex w-full items-center rounded-sm py-2.5 text-body-sm font-medium text-error-fg hover:bg-error-bg/20 transition-all duration-150",
                                desktopSidebarExpanded ? "gap-3 px-3" : "justify-center px-0",
                            )}
                            aria-label="Log out"
                            title={desktopSidebarExpanded ? undefined : "Log out"}
                        >
                            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                            {desktopSidebarExpanded && "Log Out"}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div
                className={cn(
                    "flex flex-col w-full h-full overflow-hidden transition-[padding] duration-200 ease-in-out",
                    desktopSidebarExpanded ? "md:pl-64" : "md:pl-20",
                )}
            >
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
