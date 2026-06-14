"use client";

import { TopBar } from "@/components/layout";
import { PackageCard, PaymentSheet } from "@/components/promotion";
import { Button, Card, EmptyState } from "@/components/ui";
import { getPackageOffer } from "@/lib/mock/packages";
import { usePurchases } from "@/lib/mock/purchases-store";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";

interface PayPageProps {
    params: Promise<{ offerId: string }>;
}

export default function PayPage({ params }: PayPageProps) {
    const { offerId } = use(params);
    const offer = useMemo(() => getPackageOffer(offerId), [offerId]);
    const router = useRouter();

    const { createPending, approvePending, purchases } = usePurchases();
    const [purchaseId, setPurchaseId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const purchase = purchaseId
        ? purchases.find((p) => p.id === purchaseId)
        : null;
    const isPending = purchase?.status === "PENDING";

    if (!offer) {
        return (
            <>
                <TopBar title="Pay" back="/promotion" />
                <EmptyState
                    title="Package not found"
                    description="This offer may have been retired. Browse the current packs from the Promotion page."
                />
            </>
        );
    }

    function startPayment() {
        setSheetOpen(true);
    }

    function handleMarkPaid() {
        if (!offer || purchaseId) return;
        // AC4 — "Mark as paid" creates the PendingPurchase (frontend stub of the
        // future POST /api/purchases call).
        const id = createPending(offer.id);
        setPurchaseId(id);
    }

    return (
        <>
            <TopBar title="Pay" back="/promotion" />

            <div className="flex flex-col gap-4">
                <PackageCard offer={offer} />

                <Card className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-display text-overline uppercase tracking-[0.08em] text-primary-700">
                        <ShieldCheck
                            strokeWidth={1.75}
                            className="h-4 w-4"
                            aria-hidden
                        />
                        How payment works
                    </div>
                    <ol className="flex flex-col gap-2 font-sans text-body-sm text-neutral-text-2">
                        <li>
                            1. Tap <strong>Continue to payment</strong> to open
                            the QR.
                        </li>
                        <li>
                            2. Scan with any Thai banking app and transfer the
                            amount.
                        </li>
                        <li>
                            3. Tap{" "}
                            <strong>I&apos;ve paid — request approval</strong>.
                            The studio verifies and activates your pack within
                            24 hours.
                        </li>
                    </ol>
                </Card>

                <Button variant="primary" fullWidth onClick={startPayment}>
                    Continue to payment
                </Button>

                {/* Dev-only: simulate the studio approving the pending purchase. */}
                {process.env.NODE_ENV !== "production" &&
                    purchaseId &&
                    isPending && (
                        <Card elevation="sm" className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-sans text-caption font-medium uppercase tracking-[0.08em] text-neutral-text-3">
                                <Sparkles
                                    strokeWidth={1.75}
                                    className="h-4 w-4"
                                />
                                Dev: simulate studio side
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    approvePending(purchaseId);
                                    setSheetOpen(false);
                                    router.push("/profile");
                                }}
                            >
                                Approve this pending purchase
                            </Button>
                        </Card>
                    )}
            </div>

            <PaymentSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                offer={offer}
                onMarkPaid={handleMarkPaid}
                isPending={isPending}
            />
        </>
    );
}
