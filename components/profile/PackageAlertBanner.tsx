import { cn } from "@/lib/cn";
import { differenceInCalendarDays } from "date-fns";
import { PackageIcon } from "lucide-react";

export interface PackageAlertBannerProps {
    expiresAt: string;
    classesRemaining: number;
    className?: string;
}

export function PackageAlertBanner({
    expiresAt,
    classesRemaining,
    className,
}: PackageAlertBannerProps) {
    const daysLeft = differenceInCalendarDays(new Date(expiresAt), new Date());
    if (daysLeft > 7) return null;

    const expLabel = new Date(expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3",
                className,
            )}
            role="alert"
        >
            <PackageIcon
                strokeWidth={1.75}
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden
            />
            <div className="min-w-0">
                <p className="font-sans text-body-sm font-semibold text-amber-800">
                    Classes expire soon
                </p>
                <p className="mt-0.5 font-sans text-body-sm text-amber-700">
                    <span className="font-semibold">
                        {classesRemaining} {classesRemaining === 1 ? "class expires" : "classes expire"}
                    </span>{" "}
                    on <span className="font-semibold">{expLabel}</span>.
                </p>
            </div>
        </div>
    );
}
