import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { Instructor } from "@/lib/api/instructors";
import Link from "next/link";

export interface InstructorGridProps {
    instructors: Instructor[];
    className?: string;
}

export function InstructorGrid({ instructors, className }: InstructorGridProps) {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <h2 className="font-display text-h3 font-semibold text-neutral-ink">
                Meet your instructors
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {instructors.map((ins) => (
                    <Link
                        key={ins.id}
                        href={`/instructors/${ins.slug}`}
                        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                        <div className="overflow-hidden rounded-xl border border-neutral-line bg-neutral-card">
                            <div className="flex h-36 items-center justify-center bg-neutral-200">
                                <Avatar
                                    fallback={ins.initials}
                                    alt={ins.name}
                                    size="lg"
                                />
                            </div>
                            <div className="px-3 py-2.5">
                                <p className="font-display text-body-lg font-semibold text-neutral-ink">
                                    {ins.name}
                                </p>
                                <p className="mt-0.5 font-sans text-caption text-primary-600">
                                    {ins.title
                                        .split("·")
                                        .map((s) => s.trim())
                                        .join(" · ")}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
