import { cn } from "@/lib/cn";
import { getRecentActivity } from "@/lib/mock/activity";
import { getISOWeek, getMonth, getYear } from "date-fns";

export interface StatsRowProps {
    classesAttended: number;
    className?: string;
}

function deriveStats(classesAttended: number) {
    const activity = getRecentActivity(classesAttended);
    const now = new Date();
    const thisMonth = getMonth(now);
    const thisYear = getYear(now);
    const thisWeek = getISOWeek(now);

    const classesThisMonth = activity.filter((a) => {
        return (
            getMonth(a.occurredAt) === thisMonth &&
            getYear(a.occurredAt) === thisYear
        );
    }).length;

    // Week streak: count consecutive ISO-weeks going back from current week
    // that each contain at least one attended class.
    const weekSet = new Set(
        activity.map(
            (a) => `${getYear(a.occurredAt)}-${getISOWeek(a.occurredAt)}`,
        ),
    );
    let streak = 0;
    let year = thisYear;
    let week = thisWeek;
    while (weekSet.has(`${year}-${week}`)) {
        streak++;
        week--;
        if (week === 0) {
            week = 52;
            year--;
        }
    }

    return { classesThisMonth, weekStreak: streak };
}

interface StatTileProps {
    value: number;
    label: string;
}

function StatTile({ value, label }: StatTileProps) {
    return (
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-neutral-line bg-neutral-card px-3 py-3">
            <span className="font-display text-2xl font-semibold text-primary-600">
                {value}
            </span>
            <span className="text-center font-sans text-caption text-neutral-text-2">
                {label}
            </span>
        </div>
    );
}

export function StatsRow({ classesAttended, className }: StatsRowProps) {
    const { classesThisMonth, weekStreak } = deriveStats(classesAttended);

    return (
        <div className={cn("flex gap-3", className)}>
            <StatTile value={classesAttended} label="Classes taken" />
            <StatTile value={classesThisMonth} label="This month" />
            <StatTile value={weekStreak} label="Week streak" />
        </div>
    );
}
