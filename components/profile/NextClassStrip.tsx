import { cn } from "@/lib/cn";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export interface NextClassStripProps {
    className_: string;
    instructorName: string;
    startsAt: Date;
    durationMin: number;
    href?: string;
    className?: string;
}

export function NextClassStrip({
    className_,
    instructorName,
    startsAt,
    durationMin,
    className,
}: NextClassStripProps) {
    const endsAt = new Date(startsAt.getTime() + durationMin * 60 * 1000);
    const dayLabel = format(startsAt, "EEE MMM d");
    const timeLabel = `${format(startsAt, "h:mm")}–${format(endsAt, "h:mm a")}`;

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3",
                className,
            )}
        >
            <CalendarIcon
                strokeWidth={1.75}
                className="h-5 w-5 shrink-0 text-blue-500"
                aria-hidden
            />
            <div className="min-w-0">
                <p className="font-sans text-body-sm font-semibold text-blue-800">
                    Next class:{" "}
                    <span className="text-blue-700">{className_}</span>
                </p>
                <p className="mt-0.5 font-sans text-caption text-blue-600">
                    {dayLabel} · {timeLabel} · {instructorName}
                </p>
            </div>
        </div>
    );
}
