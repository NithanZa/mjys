import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { StaffMember } from "@/lib/mock/about";
import { PhoneCallIcon } from "lucide-react";

export interface StaffCardProps {
    staff: StaffMember;
    className?: string;
}

export function StaffCard({ staff, className }: StaffCardProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-xl border border-neutral-line bg-neutral-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md",
                className,
            )}
        >
            <Avatar fallback={staff.initials} alt={staff.name} size="md" />
            <div className="flex-1 min-w-0">
                <p className="font-sans text-body font-semibold text-neutral-ink">
                    {staff.name}
                </p>
                <p className="font-sans text-caption text-neutral-text-2">
                    {staff.role}
                </p>
                <a
                    href={`tel:${staff.phone.replace(/[^0-9+]/g, "")}`}
                    className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary-300 bg-primary-50 px-2.5 py-0.5 font-sans text-caption font-medium text-primary-700 hover:bg-primary-100"
                >
                    <PhoneCallIcon strokeWidth={1.75} className="h-3 w-3" aria-hidden />
                    {staff.phone}
                </a>
            </div>
        </div>
    );
}
