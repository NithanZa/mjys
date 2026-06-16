import { cn } from "@/lib/cn";
import { PersonStanding } from "lucide-react";
import Image from "next/image";

export interface PoseCardProps {
    name: string;
    description: string;
    imageUrl?: string;
    className?: string;
}

export function PoseCard({
    name,
    description,
    imageUrl,
    className,
}: PoseCardProps) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-accent-200 bg-accent-50 shadow-sm",
                className,
            )}
        >
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={name}
                    width={600}
                    height={160}
                    className="h-40 w-full object-cover"
                />
            ) : (
                <div className="flex h-28 items-center justify-center bg-accent-100">
                    <PersonStanding
                        strokeWidth={1.5}
                        className="h-14 w-14 text-accent-500"
                        aria-hidden
                    />
                </div>
            )}
            <div className="px-4 py-3">
                <p className="font-sans text-caption font-semibold uppercase tracking-[0.08em] text-accent-700">
                    Pose of the week
                </p>
                <h3 className="mt-0.5 font-display text-h3 font-medium text-neutral-ink">
                    {name}
                </h3>
                <p className="mt-1 font-sans text-body-sm text-neutral-text-2">
                    {description}
                </p>
            </div>
        </div>
    );
}
