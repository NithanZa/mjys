"use client";

import { TopBar } from "@/components/layout";
import { SlipUpload } from "@/components/promotion";
import { Button, Card, EmptyState, QRCode } from "@/components/ui";
import { formatDateLong, formatTime } from "@/lib/dates";
import { fetchOccurrence, OccurrenceView } from "@/lib/api/classes";
import { useSpecialAdmission } from "@/lib/api/special-purchases";
import { isStandaloneMode } from "@/lib/auth/mode";
import { getLiffAuthHeaders, useLiff } from "@/lib/liff";
import { CheckCircle2, Clock, Copy, ImageUp, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

interface PayPageProps {
    params: Promise<{ occurrenceId: string }>;
}

const PROMPTPAY_ID = "0812345678";

function buildQrPayload(occurrenceId: string, amount: number, promptpayId: string) {
    return `MJYS-PAY:v1:${promptpayId}:special:${occurrenceId}:${amount}`;
}

export default function SpecialClassPayPage({ params }: PayPageProps) {
    const { occurrenceId } = use(params);
    const { liff } = useLiff();
    const [occurrence, setOccurrence] = useState<OccurrenceView | null>(null);
    const [loading, setLoading] = useState(true);
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [copied, setCopied] = useState(false);
    const { admission, refresh: refreshAdmission } = useSpecialAdmission(occurrenceId);

    const isStandalone = isStandaloneMode;

    useEffect(() => {
        let cancelled = false;
        fetchOccurrence(occurrenceId)
            .then((occ) => {
                if (!cancelled) setOccurrence(occ);
            })
            .catch((err) => {
                console.error("Failed to load class occurrence:", err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [occurrenceId]);

    async function getAuthHeaders(): Promise<Record<string, string>> {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (!isStandalone) {
            Object.assign(headers, getLiffAuthHeaders(liff));
        }
        return headers;
    }

    async function uploadSlip(file: File): Promise<string> {
        const form = new FormData();
        form.append("file", file);
        const uploadHeaders: Record<string, string> = {};
        if (!isStandalone) {
            Object.assign(uploadHeaders, getLiffAuthHeaders(liff));
        }
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: uploadHeaders,
            body: form,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to upload slip");
        }
        const data = await res.json();
        return data.path as string;
    }

    async function handleSubmit() {
        if (!occurrence || !slipFile || submitted) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const proofImageUrl = await uploadSlip(slipFile);
            const headers = await getAuthHeaders();
            const res = await fetch("/api/purchases", {
                method: "POST",
                headers,
                body: JSON.stringify({ classOccurrenceId: occurrence.id, proofImageUrl }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit payment");
            }
            setSubmitted(true);
            await refreshAdmission();
        } catch (err) {
            console.error("Failed to submit special-class payment:", err);
            setSubmitError(
                err instanceof Error ? err.message : "Something went wrong. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function copyAmount() {
        if (!occurrence?.specialPriceTHB) return;
        try {
            await navigator.clipboard.writeText(String(occurrence.specialPriceTHB));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* noop */ }
    }

    if (loading) {
        return (
            <>
                <TopBar title="Pay" back={`/book/${occurrenceId}`} />
                <div className="py-12 text-center font-sans text-body-sm text-neutral-text-3">
                    Loading class…
                </div>
            </>
        );
    }

    if (!occurrence) {
        return (
            <>
                <TopBar title="Pay" back={`/book/${occurrenceId}`} />
                <EmptyState
                    title="Class not found"
                    description="This class may have been removed or rescheduled."
                />
            </>
        );
    }

    if (!occurrence.isSpecial || !occurrence.specialPriceTHB) {
        return (
            <>
                <TopBar title="Pay" back={`/book/${occurrenceId}`} />
                <EmptyState
                    title="Not a special class"
                    description="This class does not require separate payment. You can book it directly."
                />
                <div className="px-4 pb-4">
                    <Link href={`/book/${occurrenceId}`}>
                        <Button variant="primary" fullWidth>Back to class</Button>
                    </Link>
                </div>
            </>
        );
    }

    const price = occurrence.specialPriceTHB;
    const qrValue = buildQrPayload(occurrence.id, price, PROMPTPAY_ID);

    // Already approved: member has been auto-booked upon approval.
    if (admission.status === "APPROVED" && !submitted) {
        return (
            <>
                <TopBar title="Pay" back={`/book/${occurrenceId}`} />
                <Card className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-success-bg text-success-fg">
                        <CheckCircle2 strokeWidth={1.75} className="h-7 w-7" aria-hidden />
                    </span>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-display text-h2 font-medium text-neutral-ink">
                            Payment approved & spot reserved!
                        </h3>
                        <p className="font-sans text-body text-neutral-text-2">
                            Your spot in <strong>{occurrence.name}</strong> is confirmed.
                        </p>
                    </div>
                    <Link href={`/book/${occurrenceId}`}>
                        <Button variant="primary">View Class Details</Button>
                    </Link>
                </Card>
            </>
        );
    }

    return (
        <>
            <TopBar title="Pay" back={`/book/${occurrenceId}`} />

            <div className="flex flex-col gap-4">
                {/* Class summary */}
                <Card elevation="sm" className="bg-breath flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-sans text-body-sm font-medium text-primary-700">
                        <Sparkles className="h-4 w-4" aria-hidden />
                        Special class admission
                    </div>
                    <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                        {occurrence.name}
                    </h1>
                    <p className="font-sans text-body text-neutral-text-2">
                        {occurrence.tagline}
                    </p>
                    <div className="flex items-center gap-2 font-sans text-caption text-neutral-text-2">
                        <Clock strokeWidth={1.75} className="h-4 w-4" aria-hidden />
                        {formatDateLong(occurrence.startsAt)} · {formatTime(occurrence.startsAt)} · {occurrence.durationMin} min
                    </div>
                    <p className="font-sans text-caption text-neutral-text-3">
                        Valid for this session only. Class packs cannot be used.
                    </p>
                </Card>

                {admission.status === "REJECTED" && !submitted && (
                    <div className="rounded-sm bg-error-bg border border-error-fg/30 p-3 font-sans text-body-sm text-error-fg">
                        Your last payment was rejected
                        {admission.rejectionReason ? `: ${admission.rejectionReason}` : "."} Please submit a new slip below.
                    </div>
                )}

                {(submitted || admission.status === "PENDING") ? (
                    <Card className="flex flex-col items-center gap-4 py-6 text-center">
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-warning-bg text-warning-fg">
                            <Clock strokeWidth={1.75} className="h-7 w-7" aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-display text-h2 font-medium text-neutral-ink">
                                Waiting for studio approval
                            </h3>
                            <p className="font-sans text-body text-neutral-text-2">
                                Your payment for <strong>{occurrence.name}</strong> is in the queue.
                                We&apos;ll send a LINE notification once it&apos;s approved, and then
                                you can book this class.
                            </p>
                        </div>
                        <Link href={`/book/${occurrenceId}`}>
                            <Button variant="secondary">Back to class</Button>
                        </Link>
                    </Card>
                ) : (
                    <>
                        {/* QR code */}
                        <Card elevation="sm" className="flex flex-col items-center gap-3">
                            <QRCode value={qrValue} size={208} ariaLabel="Payment QR code" />
                            <div className="flex flex-col items-center gap-1 text-center">
                                <p className="font-display text-h3 font-medium text-neutral-ink">
                                    Scan to pay ฿{price.toLocaleString()}
                                </p>
                                <p className="font-sans text-caption text-neutral-text-2">
                                    PromptPay · {PROMPTPAY_ID}
                                </p>
                            </div>
                        </Card>

                        {/* Amount + copy */}
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
                                    ฿{price.toLocaleString()}
                                    {copied ? (
                                        <CheckCircle2 strokeWidth={1.75} className="h-4 w-4 text-success-fg" aria-hidden />
                                    ) : (
                                        <Copy strokeWidth={1.75} className="h-4 w-4 text-neutral-text-3" aria-hidden />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-sans text-body-sm text-neutral-text-2">
                                    Class
                                </span>
                                <span className="font-sans text-body-sm font-medium text-neutral-ink">
                                    {occurrence.name}
                                </span>
                            </div>
                        </Card>

                        {/* How payment works */}
                        <Card className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-display text-overline uppercase tracking-[0.08em] text-primary-700">
                                <ShieldCheck strokeWidth={1.75} className="h-4 w-4" aria-hidden />
                                How payment works
                            </div>
                            <ol className="flex flex-col gap-2 font-sans text-body-sm text-neutral-text-2">
                                <li>1. Scan the QR code with any Thai banking app and transfer ฿{price.toLocaleString()}.</li>
                                <li>2. Snap a photo of your transfer slip and upload it below.</li>
                                <li>3. The studio will verify your payment within 24 hours.</li>
                                <li>4. Once approved, your spot is automatically booked — no extra steps needed!</li>
                            </ol>
                        </Card>

                        {/* Slip upload */}
                        <Card className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 font-display text-overline uppercase tracking-[0.08em] text-primary-700">
                                <ImageUp strokeWidth={1.75} className="h-4 w-4" aria-hidden />
                                Upload payment slip
                            </div>
                            <SlipUpload
                                uploading={submitting}
                                onSelect={(file) => {
                                    setSlipFile(file);
                                    setSubmitError(null);
                                }}
                                onClear={() => setSlipFile(null)}
                            />
                        </Card>

                        {submitError && (
                            <p className="text-center font-sans text-caption text-error-fg">
                                {submitError}
                            </p>
                        )}

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleSubmit}
                            disabled={!slipFile || submitting}
                            loading={submitting}
                        >
                            Submit slip — request approval
                        </Button>
                        <p className="text-center font-sans text-caption text-neutral-text-3">
                            The studio will verify your slip within 24 hours. You&apos;ll get a LINE
                            notification once approved.
                        </p>
                    </>
                )}
            </div>
        </>
    );
}
