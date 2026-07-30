"use client";

import { Badge, Card, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatTHB, getPackageOffer } from "@/lib/mock/packages";
import type { MockPurchase, PurchaseStatus } from "@/lib/mock/purchases-store";
import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";

export interface TransactionHistoryProps {
    purchases: MockPurchase[];
    className?: string;
}

type StatusTone = "warning" | "success" | "error" | "neutral";

const STATUS_META: Record<
    PurchaseStatus,
    { label: string; tone: StatusTone }
> = {
    PENDING: { label: "Awaiting approval", tone: "warning" },
    APPROVED: { label: "Approved", tone: "success" },
    REJECTED: { label: "Rejected", tone: "error" },
    EXPIRED: { label: "Expired", tone: "neutral" },
    EXHAUSTED: { label: "Used up", tone: "neutral" },
};

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "";
    }
}

/**
 * Customer-facing transaction history. Lists each purchase with its package
 * name, price, status, and a tappable preview of the uploaded payment slip.
 */
export function TransactionHistory({
    purchases,
    className,
}: TransactionHistoryProps) {
    const [lightbox, setLightbox] = useState<string | null>(null);

    const sorted = useMemo(
        () =>
            [...purchases].sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            ),
        [purchases],
    );

    if (sorted.length === 0) return null;

    return (
        <section className={cn("flex flex-col gap-3", className)}>
            <h2 className="font-display text-h2 font-medium text-neutral-ink">
                Transaction history
            </h2>

            <div className="flex flex-col gap-2">
                {sorted.map((purchase) => {
                    const offer = getPackageOffer(purchase.offerId);
                    const meta = STATUS_META[purchase.status];
                    return (
                        <Card
                            key={purchase.id}
                            className="flex items-center gap-3"
                        >
                            {purchase.proofImageUrl ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setLightbox(purchase.proofImageUrl)
                                    }
                                    aria-label="View payment slip"
                                    className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-line bg-neutral-bg"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={purchase.proofImageUrl}
                                        alt="Payment slip"
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ) : (
                                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-neutral-card text-neutral-text-3">
                                    <Receipt
                                        strokeWidth={1.75}
                                        className="h-6 w-6"
                                        aria-hidden
                                    />
                                </span>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="font-display text-body-lg font-medium text-neutral-ink truncate">
                                    {offer?.name ?? "Package"}
                                </div>
                                <p className="font-sans text-caption text-neutral-text-3">
                                    {offer ? formatTHB(offer.discountPriceTHB != null && offer.discountPriceTHB < offer.priceTHB ? offer.discountPriceTHB : offer.priceTHB) : ""}
                                    {offer ? " · " : ""}
                                    {formatDate(purchase.createdAt)}
                                </p>
                                {purchase.status === "REJECTED" && purchase.rejectionReason && (
                                    <p className="font-sans text-caption text-error-fg mt-1">
                                        Reason: {purchase.rejectionReason}
                                    </p>
                                )}
                            </div>

                            <Badge tone={meta.tone}>{meta.label}</Badge>
                        </Card>
                    );
                })}
            </div>

            <Modal
                open={lightbox !== null}
                onClose={() => setLightbox(null)}
                title="Payment slip"
            >
                {lightbox && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={lightbox}
                        alt="Payment slip"
                        className="max-h-[70vh] w-full rounded-md object-contain bg-neutral-bg"
                    />
                )}
            </Modal>
        </section>
    );
}
