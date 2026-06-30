"use client";

import { TopBar } from "@/components/layout";
import { MilestoneCard, ToyGrid } from "@/components/rewards";
import { Card, EmptyState } from "@/components/ui";
import { useMember } from "@/lib/profile/use-member";
import { getMilestoneStatuses, getToyPartStatuses } from "@/lib/rewards";
import { Sparkles } from "lucide-react";

export default function CollectionPage() {
    const { member, loading } = useMember();

    if (loading) {
        return (
            <>
                <TopBar title="Collection" back="/profile" />
                <div className="flex justify-center py-12 text-neutral-text-3">
                    Loading collection...
                </div>
            </>
        );
    }

    if (!member) {
        return (
            <>
                <TopBar title="Collection" back="/profile" />
                <EmptyState
                    icon={<Sparkles strokeWidth={1.75} className="h-6 w-6" />}
                    title="No collection yet"
                    description="Your Tiger Toy parts and milestones will appear here as you attend classes."
                />
            </>
        );
    }

    const toyStatuses = getToyPartStatuses(member.classesAttended);
    const milestoneStatuses = getMilestoneStatuses(member.classesAttended);

    return (
        <>
            <TopBar title="Collection" back="/profile" />
            <div className="flex flex-col gap-6">
                {/* Tiger Toy Collection */}
                <div className="flex flex-col gap-3">
                    <Card>
                        <h2 className="font-display text-h3 font-medium text-neutral-ink">
                            Tiger Toy
                        </h2>
                        <p className="mt-1 font-sans text-body text-neutral-text-2">
                            Collect all 8 parts by attending classes.
                        </p>
                    </Card>
                    <ToyGrid classesAttended={member.classesAttended} />
                    <Card elevation="sm">
                        <div className="flex items-baseline justify-between">
                            <span className="font-sans text-caption text-neutral-text-3">
                                Progress
                            </span>
                            <span className="font-sans text-body-lg font-medium text-neutral-ink">
                                {toyStatuses.filter((s) => s.earned).length} / 8
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Milestones */}
                <div className="flex flex-col gap-3">
                    <Card>
                        <h2 className="font-display text-h3 font-medium text-neutral-ink">
                            Milestones
                        </h2>
                        <p className="mt-1 font-sans text-body text-neutral-text-2">
                            Unlock rewards as you reach class milestones.
                        </p>
                    </Card>
                    <div className="flex flex-col gap-3">
                        {milestoneStatuses.map((status) => (
                            <MilestoneCard
                                key={status.milestone.code}
                                status={status}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
