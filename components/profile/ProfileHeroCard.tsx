import { LevelBadge } from "@/components/profile/LevelBadge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { getLevel } from "@/lib/levels";

export interface ProfileHeroCardProps {
    displayName: string;
    email?: string;
    classesAttended: number;
    className?: string;
}

export function ProfileHeroCard({
    displayName,
    email,
    classesAttended,
    className,
}: ProfileHeroCardProps) {
    const level = getLevel(classesAttended);

    return (
        <div
            className={cn(
                "rounded-xl bg-linear-to-br from-primary-200 via-primary-100 to-accent-100 px-5 py-5",
                className,
            )}
        >
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                    <Avatar
                        fallback={displayName}
                        size="lg"
                        alt={displayName}
                        className="ring-2 ring-white"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-display text-h2 font-semibold text-neutral-ink truncate">
                        {displayName}
                    </h2>
                    {email && (
                        <p className="mt-0.5 font-sans text-body-sm text-neutral-text-2 truncate">
                            {email}
                        </p>
                    )}
                    <div className="mt-2">
                        <LevelBadge
                            level={level.level}
                            label={level.label}
                            isCentury={level.isCentury}
                            size="sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
