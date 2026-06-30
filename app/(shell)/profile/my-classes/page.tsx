"use client";

import { TopBar } from "@/components/layout";
import { RecentActivityList } from "@/components/rewards";
import { Card, EmptyState } from "@/components/ui";
import { useMember } from "@/lib/profile/use-member";
import { useClassHistory } from "@/lib/profile/use-class-history";
import { CalendarCheck } from "lucide-react";

export default function MyClassesPage() {
    const { member, loading: memberLoading } = useMember();
    const { history: allActivity, loading: historyLoading } = useClassHistory();

    if (memberLoading || historyLoading) {
        return (
            <>
                <TopBar title="My Classes" back="/profile" />
                <div className="flex justify-center py-12 text-neutral-text-3">
                    Loading class history...
                </div>
            </>
        );
    }

    if (!member) {
        return (
            <>
                <TopBar title="My Classes" back="/profile" />
                <EmptyState
                    icon={
                        <CalendarCheck strokeWidth={1.75} className="h-6 w-6" />
                    }
                    title="No classes yet"
                    description="Your class history will appear here once you attend your first class."
                />
            </>
        );
    }

    if (allActivity.length === 0) {
        return (
            <>
                <TopBar title="My Classes" back="/profile" />
                <EmptyState
                    icon={
                        <CalendarCheck strokeWidth={1.75} className="h-6 w-6" />
                    }
                    title="No classes yet"
                    description="Your class history will appear here once you attend your first class."
                />
            </>
        );
    }

    return (
        <>
            <TopBar title="My Classes" back="/profile" />
            <div className="flex flex-col gap-4">
                <Card>
                    <div className="flex items-baseline justify-between">
                        <h2 className="font-display text-h3 font-medium text-neutral-ink">
                            All Classes
                        </h2>
                        <span className="font-sans text-caption text-neutral-text-3">
                            {allActivity.length}{" "}
                            {allActivity.length === 1 ? "class" : "classes"}
                        </span>
                    </div>
                </Card>
                <RecentActivityList items={allActivity} />
            </div>
        </>
    );
}
