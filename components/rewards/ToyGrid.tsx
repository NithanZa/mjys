import { ToySlot } from "@/components/rewards/ToySlot";
import { cn } from "@/lib/cn";
import { getToyPartStatuses } from "@/lib/rewards";

export interface ToyGridProps {
  classesAttended: number;
  className?: string;
}

export function ToyGrid({ classesAttended, className }: ToyGridProps) {
  const statuses = getToyPartStatuses(classesAttended);

  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {statuses.map(({ part, earned }) => (
        <ToySlot key={part.code} part={part} earned={earned} />
      ))}
    </div>
  );
}
