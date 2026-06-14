import { StaffCard } from "@/components/about/StaffCard";
import { cn } from "@/lib/cn";
import type { StaffMember } from "@/lib/mock/about";

export interface StaffListProps {
    staff: StaffMember[];
    className?: string;
}

export function StaffList({ staff, className }: StaffListProps) {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <h2 className="font-display text-h3 font-semibold text-neutral-ink">
                Our staff
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {staff.map((s) => (
                    <StaffCard key={s.id} staff={s} />
                ))}
            </div>
        </div>
    );
}
