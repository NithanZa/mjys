import type { PackageStatus } from "@/generated/prisma/client";

export interface CreditLot {
    id: string;
    classesRemaining: number;
    expiresAt: Date;
    createdAt: Date;
}

export const usableLotsWhere = (now: Date) => ({
    expiresAt: { gte: now },
    classesRemaining: { gt: 0 },
});

export function sumRemaining(
    lots: ReadonlyArray<Pick<CreditLot, "classesRemaining">>,
): number {
    return lots.reduce((total, lot) => total + lot.classesRemaining, 0);
}

export function pickFifoLot<T extends CreditLot>(
    lots: ReadonlyArray<T>,
): T | null {
    return (
        [...lots]
            .filter((lot) => lot.classesRemaining > 0)
            .sort(
                (a, b) =>
                    a.expiresAt.getTime() - b.expiresAt.getTime() ||
                    a.createdAt.getTime() - b.createdAt.getTime(),
            )[0] ?? null
    );
}

export function syncLotStatus(
    lot: Pick<CreditLot, "classesRemaining" | "expiresAt">,
    now: Date,
): PackageStatus {
    if (lot.expiresAt < now) return "EXPIRED";
    if (lot.classesRemaining <= 0) return "EXHAUSTED";
    return "ACTIVE";
}
