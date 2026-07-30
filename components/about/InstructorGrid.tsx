"use client";

import { Avatar, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Instructor } from "@/lib/api/instructors";
import { motion } from "motion/react";
import { UsersIcon } from "lucide-react";
import Image from "next/image";

export interface InstructorGridProps {
    instructors: Instructor[];
    isLoading?: boolean;
    className?: string;
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="overflow-hidden rounded-xl border border-neutral-line bg-neutral-card shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="relative aspect-square w-full max-w-56 mx-auto overflow-hidden bg-neutral-200">
                {instructor.photoUrl ? (
                    <Image
                        src={instructor.photoUrl}
                        alt={instructor.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 224px"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Avatar
                            src={null}
                            alt={instructor.name}
                            fallback={instructor.initials}
                            size="xl"
                        />
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1 p-4">
                <p className="font-display text-body-lg font-semibold text-neutral-ink">
                    {instructor.name}
                </p>
                <p className="font-sans text-body-sm font-medium text-primary-700">
                    {instructor.title
                        .split("·")
                        .map((s) => s.trim())
                        .join(" · ")}
                </p>
                <p className="font-sans text-body-sm text-neutral-text-2 whitespace-pre-wrap">
                    {instructor.bio}
                </p>
            </div>
        </motion.div>
    );
}

function InstructorSkeleton() {
    return (
        <div className="overflow-hidden rounded-xl border border-neutral-line bg-neutral-card">
            <Skeleton className="aspect-square w-full max-w-56 mx-auto rounded-none" />
            <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );
}

export function InstructorGrid({ instructors, isLoading, className }: InstructorGridProps) {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <h2 className="font-display text-h3 font-semibold text-neutral-ink">
                Meet your instructors
            </h2>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <InstructorSkeleton key={i} />
                    ))}
                </div>
            ) : instructors.length === 0 ? (
                <EmptyState
                    icon={<UsersIcon strokeWidth={1.75} className="h-6 w-6" />}
                    title="No instructors yet"
                    description="Check back soon to meet the team."
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {instructors.map((instructor) => (
                        <InstructorCard key={instructor.id} instructor={instructor} />
                    ))}
                </div>
            )}
        </div>
    );
}
