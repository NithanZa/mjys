"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";
import { Button, Card, Badge, Modal } from "@/components/ui";
import {
    FileCheck,
    Check,
    X,
    Clock,
    Phone,
    Mail,
    User,
    Eye,
    AlertCircle,
    Loader,
} from "lucide-react";

interface Purchase {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    proofImageUrl: string | null;
    createdAt: string;
    reviewedAt: string | null;
    member: {
        id: string;
        displayName: string;
        email: string;
        phone: string;
    };
    offer: {
        id: string;
        name: string;
        priceTHB: number;
        classCount: number | null;
        validityDays: number;
    };
}

export default function AdminSlipsPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
    const [selectedPurchase, setSelectedOcc] = useState<Purchase | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadPurchases = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/purchases?status=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setPurchases(data.purchases);
            }
        } catch (error) {
            console.error("Failed to load purchases:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadPurchases();
    }, [loadPurchases]);

    const handleResolve = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedPurchase) return;
        if (
            !confirm(
                `Are you sure you want to mark this transaction as ${status}?${
                    status === "APPROVED"
                        ? "\n\nThis will instantly activate the package and credit classes to the member's account."
                        : "\n\nThis will deny the purchase request."
                }`,
            )
        ) {
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseId: selectedPurchase.id,
                    status,
                }),
            });

            if (res.ok) {
                alert(`Transaction has been successfully ${status.toLowerCase()}!`);
                setSelectedOcc(null);
                loadPurchases();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update transaction status.");
            }
        } catch (error) {
            console.error(error);
            alert("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto h-full font-sans">
            <div>
                <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                    Slip Approvals
                </h1>
                <p className="text-body-sm text-neutral-text-2">
                    Verify and approve customer payment slips to activate class passes and packages.
                </p>
            </div>

            {/* TAB SYSTEM */}
            <div className="flex border-b border-neutral-line">
                {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 font-display text-body-sm font-semibold transition-all duration-150 border-b-2 -mb-[2px] ${
                            activeTab === tab
                                ? "border-primary-500 text-primary-700 font-bold"
                                : "border-transparent text-neutral-text-3 hover:text-neutral-ink"
                        }`}
                    >
                        {tab === "PENDING"
                            ? "Pending Review"
                            : tab === "APPROVED"
                              ? "Approved Passes"
                              : "Rejected / Denied"}
                    </button>
                ))}
            </div>

            {/* PURCHASES LIST */}
            <div className="flex-grow min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Loader className="h-8 w-8 animate-spin text-primary-600" />
                        <span className="text-body-sm text-neutral-text-3 font-medium">Loading transactions list…</span>
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 border border-neutral-line rounded-md bg-neutral-card text-center">
                        <FileCheck className="h-12 w-12 text-neutral-line mb-3" />
                        <p className="font-display text-h3 font-semibold text-neutral-ink">
                            {activeTab === "PENDING"
                                ? "No pending slips!"
                                : activeTab === "APPROVED"
                                  ? "No approved purchases yet"
                                  : "No rejected purchases"}
                        </p>
                        <p className="font-sans text-caption text-neutral-text-3 max-w-md mt-1">
                            {activeTab === "PENDING"
                                ? "You have successfully reviewed all payment requests. High five!"
                                : "Approved passes and payment transactions will appear in this log."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-neutral-line bg-neutral-card rounded-md shadow-sm">
                        <table className="w-full text-left border-collapse text-body-sm">
                            <thead>
                                <tr className="border-b border-neutral-line bg-neutral-bg font-display text-overline uppercase tracking-[0.08em] text-neutral-text-2">
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Package</th>
                                    <th className="p-4">Price (THB)</th>
                                    <th className="p-4">Requested On</th>
                                    {activeTab !== "PENDING" && <th className="p-4">Reviewed On</th>}
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-line">
                                {purchases.map((purchase) => {
                                    const createdLocal = toZonedTime(parseISO(purchase.createdAt), STUDIO_TZ);
                                    const reviewedLocal = purchase.reviewedAt
                                        ? toZonedTime(parseISO(purchase.reviewedAt), STUDIO_TZ)
                                        : null;

                                    return (
                                        <tr key={purchase.id} className="hover:bg-primary-50/20 transition-all">
                                            <td className="p-4 font-display font-semibold text-neutral-ink">
                                                <div className="flex flex-col">
                                                    <span>{purchase.member.displayName}</span>
                                                    <span className="font-sans text-caption text-neutral-text-3">
                                                        📞 {purchase.member.phone}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-neutral-ink">
                                                        {purchase.offer.name}
                                                    </span>
                                                    <span className="font-sans text-caption text-neutral-text-3">
                                                        {purchase.offer.classCount ?? "Unlimited"} classes · {purchase.offer.validityDays}d
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-semibold text-neutral-ink">
                                                ฿{purchase.offer.priceTHB.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-neutral-text-2">
                                                {format(createdLocal, "d MMM yyyy, HH:mm")}
                                            </td>
                                            {reviewedLocal && (
                                                <td className="p-4 text-neutral-text-3">
                                                    {format(reviewedLocal, "d MMM yyyy, HH:mm")}
                                                </td>
                                            )}
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<Eye className="h-4 w-4" />}
                                                    onClick={() => setSelectedOcc(purchase)}
                                                >
                                                    {activeTab === "PENDING" ? "Verify Slip" : "View"}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* REVIEW SLIP MODAL */}
            <Modal
                open={selectedPurchase !== null}
                onClose={() => setSelectedOcc(null)}
                title="Review Transfer Slip"
            >
                {selectedPurchase && (
                    <div className="flex flex-col md:flex-row gap-6 max-w-4xl font-sans mt-4">
                        {/* Left column: Slip Image Preview */}
                        <div className="flex-1 max-w-md border border-neutral-line rounded-md overflow-hidden bg-neutral-bg flex flex-col justify-center min-h-[300px]">
                            {selectedPurchase.proofImageUrl ? (
                                <div className="p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={selectedPurchase.proofImageUrl}
                                        alt="Uploaded bank receipt slip"
                                        className="max-h-[500px] w-full object-contain rounded-sm"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center gap-2">
                                    <AlertCircle className="h-10 w-12 text-neutral-text-3" />
                                    <p className="font-display font-semibold text-body text-neutral-ink">
                                        No slip image uploaded
                                    </p>
                                    <p className="text-caption text-neutral-text-3">
                                        This was created in simulated/local-mock development mode without a file upload attachment.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right column: Roster details and Actions */}
                        <div className="flex-1 flex flex-col justify-between gap-5">
                            <div className="flex flex-col gap-4">
                                <div className="border-b border-neutral-line pb-3">
                                    <span className="text-overline uppercase tracking-[0.08em] text-neutral-text-3">
                                        Customer Details
                                    </span>
                                    <h2 className="font-display text-h2 font-semibold text-neutral-ink mt-1">
                                        {selectedPurchase.member.displayName}
                                    </h2>
                                    <div className="flex flex-col gap-1.5 mt-2.5 text-body-sm text-neutral-text-2">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-neutral-text-3" />
                                            <span>{selectedPurchase.member.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-neutral-text-3" />
                                            <span>{selectedPurchase.member.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-neutral-text-3" />
                                            <span className="font-mono text-caption bg-neutral-line/30 px-1.5 py-0.5 rounded-sm">ID: {selectedPurchase.member.id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-overline uppercase tracking-[0.08em] text-neutral-text-3">
                                        Purchase Specifications
                                    </span>
                                    <div className="bg-primary-50/50 border border-primary-200 rounded-md p-4 mt-2 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-display text-body font-semibold text-neutral-ink">
                                                {selectedPurchase.offer.name}
                                            </span>
                                            <span className="text-caption text-neutral-text-2">
                                                {selectedPurchase.offer.classCount ?? "Unlimited"} class credits · Valid for {selectedPurchase.offer.validityDays} days
                                            </span>
                                        </div>
                                        <span className="font-display text-h2 font-bold text-neutral-ink">
                                            ฿{selectedPurchase.offer.priceTHB.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-neutral-bg border border-neutral-line rounded-md p-3.5 flex gap-2 items-start text-caption text-neutral-text-2">
                                    <Clock className="h-4 w-4 mt-0.5 text-neutral-text-3 shrink-0" />
                                    <span>
                                        Requested on {format(toZonedTime(parseISO(selectedPurchase.createdAt), STUDIO_TZ), "EEEE, d MMMM yyyy, HH:mm")}
                                    </span>
                                </div>
                            </div>

                            {/* Verification Controls */}
                            {selectedPurchase.status === "PENDING" ? (
                                <div className="flex flex-col gap-2.5 border-t border-neutral-line pt-4 shrink-0">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        fullWidth
                                        loading={submitting}
                                        disabled={submitting}
                                        leftIcon={<Check className="h-5 w-5" />}
                                        onClick={() => handleResolve("APPROVED")}
                                    >
                                        Approve Payment & Activate Pack
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        fullWidth
                                        loading={submitting}
                                        disabled={submitting}
                                        leftIcon={<X className="h-5 w-5" />}
                                        onClick={() => handleResolve("REJECTED")}
                                    >
                                        Reject / Deny Request
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-t border-neutral-line pt-4 text-center shrink-0">
                                    <Badge
                                        tone={selectedPurchase.status === "APPROVED" ? "success" : "error"}
                                        className="text-body-sm font-semibold px-4 py-1.5"
                                    >
                                        Already {selectedPurchase.status.toLowerCase()}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
