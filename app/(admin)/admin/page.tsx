import { prisma } from "@/lib/db";
import { studioToday } from "@/lib/dates";
import { addDays } from "date-fns";
import { Card, CardHeader, CardBody } from "@/components/ui";
import {
    Calendar,
    Users,
    FileCheck,
    Scan,
    ArrowUpRight,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const today = studioToday();
    const tomorrow = addDays(today, 1);

    // Fetch dashboard stats from Prisma database
    const [classesTodayCount, pendingSlipsCount, totalMembersCount, activePackagesCount] = await Promise.all([
        prisma.classOccurrence.count({
            where: {
                startsAt: {
                    gte: today,
                    lt: tomorrow,
                },
                // Exclude cancelled classes if they are marked on template or if we just want all occurrences
            },
        }),
        prisma.pendingPurchase.count({
            where: {
                status: "PENDING",
            },
        }),
        prisma.member.count(),
        prisma.package.count({
            where: {
                status: "ACTIVE",
            },
        }),
    ]);

    const stats = [
        {
            name: "Classes Scheduled Today",
            value: classesTodayCount,
            icon: Calendar,
            color: "bg-primary-100 text-primary-700 border-primary-200",
            href: "/admin/calendar",
        },
        {
            name: "Pending Slip Approvals",
            value: pendingSlipsCount,
            icon: FileCheck,
            color: pendingSlipsCount > 0 
                ? "bg-warning-bg text-warning-fg border-warning-border animate-pulse"
                : "bg-neutral-line/30 text-neutral-text-2 border-neutral-line",
            href: "/admin/slips",
        },
        {
            name: "Registered Members",
            value: totalMembersCount,
            icon: Users,
            color: "bg-primary-100 text-primary-700 border-primary-200",
            href: "/admin/members",
        },
        {
            name: "Active Member Packages",
            value: activePackagesCount,
            icon: TrendingUp,
            color: "bg-primary-100 text-primary-700 border-primary-200",
            href: "/admin/members",
        },
    ];

    return (
        <div className="p-6 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto font-sans">
            <div>
                <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                    Sawasdee, Studio Admin!
                </h1>
                <p className="text-body-lg text-neutral-text-2">
                    Welcome to the MiTR Journey Yoga Studio administrative portal.
                </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card elevation="sm" className="bg-primary-50 border border-primary-200 flex flex-col gap-4 p-6 justify-between">
                    <div className="flex gap-4 items-start">
                        <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary-500 text-neutral-ink shadow-sm shrink-0">
                            <Scan className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="font-display text-h3 font-semibold text-neutral-ink leading-tight">
                                QR Scanner Check-In
                            </h2>
                            <p className="text-caption text-neutral-text-2 mt-1">
                                Check in customers at the counter by scanning their Member Pass.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/scanner"
                        className="inline-flex items-center gap-1.5 self-end font-sans text-body-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                    >
                        Launch Scanner <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Card>

                <Card elevation="sm" className="bg-neutral-card border border-neutral-line flex flex-col gap-4 p-6 justify-between">
                    <div className="flex gap-4 items-start">
                        <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary-100 text-primary-700 shadow-sm shrink-0">
                            <Calendar className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="font-display text-h3 font-semibold text-neutral-ink leading-tight">
                                Update Class Schedule
                            </h2>
                            <p className="text-caption text-neutral-text-2 mt-1">
                                View, create, reschedule, or cancel today&apos;s and this week&apos;s class bookings.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/calendar"
                        className="inline-flex items-center gap-1.5 self-end font-sans text-body-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                    >
                        Open Calendar <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Card>

                <Card elevation="sm" className="bg-neutral-card border border-neutral-line flex flex-col gap-4 p-6 justify-between">
                    <div className="flex gap-4 items-start">
                        <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary-100 text-primary-700 shadow-sm shrink-0">
                            <FileCheck className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="font-display text-h3 font-semibold text-neutral-ink leading-tight">
                                Review Bank Transfers
                            </h2>
                            <p className="text-caption text-neutral-text-2 mt-1">
                                Verify customer slip uploads and activate their requested packages.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/slips"
                        className="inline-flex items-center gap-1.5 self-end font-sans text-body-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                    >
                        Review Slips {pendingSlipsCount > 0 && `(${pendingSlipsCount})`} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Card>
            </div>

            {/* Statistics Dashboard */}
            <div>
                <h2 className="font-display text-h2 font-semibold text-neutral-ink mb-4">
                    Studio Activity Counts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <Link href={stat.href} key={stat.name} className="block transition-transform hover:scale-[1.01]">
                            <Card elevation="sm" className="border border-neutral-line hover:border-primary-300">
                                <CardHeader className="flex justify-between items-center w-full">
                                    <span className="font-sans text-caption font-semibold uppercase tracking-[0.08em] text-neutral-text-3">
                                        {stat.name}
                                    </span>
                                    <span className={`grid h-8 w-8 place-items-center rounded-full border ${stat.color}`}>
                                        <stat.icon className="h-4 w-4" />
                                    </span>
                                </CardHeader>
                                <CardBody className="mt-2">
                                    <p className="font-display text-display-sm font-bold text-neutral-ink">
                                        {stat.value}
                                    </p>
                                </CardBody>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
