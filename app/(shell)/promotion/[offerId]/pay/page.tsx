"use client";

import { TopBar } from "@/components/layout";
import { PackageCard } from "@/components/promotion";
import { Button, Card, EmptyState, QRCode } from "@/components/ui";
import { formatTHB, getPackageOffer } from "@/lib/mock/packages";
import { usePurchases } from "@/lib/mock/purchases-store";
import { CheckCircle2, Clock, Copy, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";

interface PayPageProps {
    params: Promise<{ offerId: string }>;
}

const PROMPTPAY_ID = "0812345678";

function buildStubQrPayload(offerId: string, amount: number, promptpayId: string) {
    return `MJYS-PAY:v1:${promptpayId}:${offerId}:${amount}`;
}

export default function PayPage({ params }: PayPageProps) {
    const { offerId } = use(params);
    const offer = useMemo(() => getPackageOffer(offerId), [offerId]);
    const router = useRouter();

    const { createPending, approvePending, purchases } = usePurchases();
    const [purchaseId, setPurchaseId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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

    async function handleMarkPaid() {
        if (!offer || purchaseId) return;
        try {
            const id = await createPending(offer.id);
            setPurchaseId(id);
        } catch (err) {
            console.error("Failed to register pending payment:", err);
        }
    }

    async function copyAmount() {
        if (!offer) return;
        try {
            await navigator.clipboard.writeText(String(offer.priceTHB));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* silently noop */
        }
    }

    const qrValue = buildStubQrPayload(offer.id, offer.priceTHB, PROMPTPAY_ID);

    return (
        <>
            <TopBar title="Pay" back="/promotion" />

            <div className="flex flex-col gap-4">
                <PackageCard offer={offer} />

                {isPending ? (
                    <Card className="flex flex-col items-center gap-4 py-6 text-center">
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-warning-bg text-warning-fg">
                            <Clock strokeWidth={1.75} className="h-7 w-7" aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-display text-h2 font-medium text-neutral-ink">
                                Waiting for studio approval
                            </h3>
                            <p className="font-sans text-body text-neutral-text-2">
                                Your {offer.name} request is in the queue. We&apos;ll send a LINE
                                notification once it&apos;s approved.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <>
                        <Card elevation="sm" className="flex flex-col items-center gap-3">
                            <QRCode value={qrValue} size={208} ariaLabel="Payment QR code" />
                            <div className="flex flex-col items-center gap-1 text-center">
                                <p className="font-display text-h3 font-medium text-neutral-ink">
                                    Scan to pay {formatTHB(offer.priceTHB)}
                                </p>
                                <p className="font-sans text-caption text-neutral-text-2">
                                    PromptPay · {PROMPTPAY_ID}
                                </p>
                            </div>
                        </Card>

                        <Card className="flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-neutral-card pb-3">
                                <span className="font-sans text-body-sm text-neutral-text-2">
                                    Amount
                                </span>
                                <button
                                    type="button"
                                    onClick={copyAmount}
                                    className="inline-flex items-center gap-1.5 font-display text-h3 font-medium text-neutral-ink hover:text-primary-700"
                                    aria-label="Copy amount"
                                >
                                    {formatTHB(offer.priceTHB)}
                                    {copied ? (
                                        <CheckCircle2
                                            strokeWidth={1.75}
                                            className="h-4 w-4 text-success-fg"
                                            aria-hidden
                                        />
                                    ) : (
                                        <Copy
                                            strokeWidth={1.75}
                                            className="h-4 w-4 text-neutral-text-3"
                                            aria-hidden
                                        />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-sans text-body-sm text-neutral-text-2">
                                    Validity
                                </span>
                                <span className="font-sans text-body-sm font-medium text-neutral-ink">
                                    {offer.validityDays} days from approval
                                </span>
                            </div>
                        </Card>

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
                                    1. Scan the QR code with any Thai banking app and transfer the amount.
                                </li>
                                <li>
                                    2. Send your payment slip and email to our{" "}
                                    <strong>LINE Official Account</strong>.
                                </li>
                                <li>
                                    3. The admin will verify and activate your pack within 24 hours.
                                </li>
                            </ol>
                        </Card>

                        <Button variant="primary" fullWidth onClick={handleMarkPaid}>
                            I&apos;ve sent the slip — request approval
                        </Button>
                        <p className="text-center font-sans text-caption text-neutral-text-3">
                            Send your payment slip and email to our LINE OA. The studio will
                            verify and activate the pack within 24 hours.
                        </p>
                    </>
                )}

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
                                    router.push("/profile");
                                }}
                            >
                                Approve this pending purchase
                            </Button>
                        </Card>
                    )}
            </div>
        </>
    );
}
