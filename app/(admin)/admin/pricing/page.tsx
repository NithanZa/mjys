"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Badge, Modal, Input, TextField } from "@/components/ui";
import {
    Tag,
    Edit3,
    Eye,
    EyeOff,
    Check,
    AlertTriangle,
    Loader,
    Sparkles,
    Trash2,
    Plus,
} from "lucide-react";

interface Offer {
    id: string;
    name: string;
    type: string;
    priceTHB: number;
    classCount: number | null;
    validityDays: number;
    tagline: string;
    perks: string[];
    highlight: boolean;
    sortOrder: number;
    active: boolean;
}

export default function AdminPricingPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Edit form states
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState(0);
    const [formTagline, setFormTagline] = useState("");
    const [formPerksStr, setFormPerksStr] = useState("");
    const [formValidity, setFormValidity] = useState(30);
    const [formActive, setFormActive] = useState(true);
    const [formHighlight, setFormHighlight] = useState(false);
    const [formSortOrder, setFormSortOrder] = useState(0);

    const loadOffers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/packages");
            if (res.ok) {
                const data = await res.json();
                setOffers(data.offers);
            }
        } catch (error) {
            console.error("Failed to load offers:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    const handleEditClick = (offer: Offer) => {
        setSelectedOffer(offer);
        setFormName(offer.name);
        setFormPrice(offer.priceTHB);
        setFormTagline(offer.tagline);
        setFormPerksStr(offer.perks.join("\n"));
        setFormValidity(offer.validityDays);
        setFormActive(offer.active);
        setFormHighlight(offer.highlight);
        setFormSortOrder(offer.sortOrder);
    };

    const handleToggleActive = async (offer: Offer) => {
        try {
            const res = await fetch(`/api/admin/packages/${offer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !offer.active }),
            });

            if (res.ok) {
                loadOffers();
            } else {
                alert("Failed to update active status.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOffer) return;

        setSubmitting(true);
        try {
            const perks = formPerksStr
                .split("\n")
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

            const res = await fetch(`/api/admin/packages/${selectedOffer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    priceTHB: formPrice,
                    tagline: formTagline,
                    perks,
                    validityDays: formValidity,
                    active: formActive,
                    highlight: formHighlight,
                    sortOrder: formSortOrder,
                }),
            });

            if (res.ok) {
                alert("Package offer updated successfully!");
                setSelectedOffer(null);
                loadOffers();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to save changes.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto h-full font-sans">
            <div>
                <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                    Pricing & Packs
                </h1>
                <p className="text-body-sm text-neutral-text-2">
                    Manage studio package rates, taglines, perks, and toggle active status on the client-facing shop.
                </p>
            </div>

            {/* OFFERS LISTING */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-2">
                    <Loader className="h-8 w-8 animate-spin text-primary-600" />
                    <span className="text-body-sm text-neutral-text-3 font-medium">Loading pricing options…</span>
                </div>
            ) : offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-neutral-line rounded-md bg-neutral-card text-center">
                    <Tag className="h-12 w-12 text-neutral-line mb-3" />
                    <p className="font-display text-h3 font-semibold text-neutral-ink">No packages found</p>
                    <p className="font-sans text-caption text-neutral-text-3 mt-1">
                        We couldn&apos;t find any packages in the database. Please seed them or create one!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map((offer) => (
                        <Card
                            key={offer.id}
                            className={`border border-neutral-line flex flex-col gap-5 justify-between relative ${
                                !offer.active ? "opacity-60 bg-neutral-bg" : ""
                            } ${offer.highlight ? "border-2 border-primary-500 shadow-md ring-2 ring-primary-50" : ""}`}
                        >
                            {/* Tags/badges at top right */}
                            <div className="absolute right-4 top-4 flex gap-1.5">
                                {offer.highlight && (
                                    <Badge tone="primary" className="font-display text-[10px] tracking-wider uppercase font-semibold">
                                        Best Value
                                    </Badge>
                                )}
                                <Badge tone={offer.active ? "success" : "neutral"} className="text-[10px] font-semibold uppercase">
                                    {offer.active ? "Active" : "Hidden"}
                                </Badge>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div>
                                    <span className="text-[11px] font-semibold text-neutral-text-3 uppercase tracking-wider">
                                        Display Order #{offer.sortOrder}
                                    </span>
                                    <h2 className="font-display text-h2 font-bold text-neutral-ink mt-0.5">
                                        {offer.name}
                                    </h2>
                                    <p className="font-sans text-caption text-neutral-text-2 italic mt-1 leading-normal">
                                        &ldquo;{offer.tagline}&rdquo;
                                    </p>
                                </div>

                                <div className="flex items-baseline gap-1 pt-1.5 border-t border-neutral-line/60">
                                    <span className="font-display text-display-sm font-extrabold text-neutral-ink">
                                        ฿{offer.priceTHB.toLocaleString()}
                                    </span>
                                    <span className="font-sans text-caption text-neutral-text-3">
                                        / {offer.classCount ?? "Unlimited"} class{offer.classCount !== 1 ? "es" : ""} · {offer.validityDays}d
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <p className="text-[11px] font-bold text-neutral-ink uppercase tracking-wider mb-1.5">
                                        Included Perks
                                    </p>
                                    <ul className="flex flex-col gap-1">
                                        {offer.perks.map((perk, i) => (
                                            <li key={i} className="flex gap-2 items-center text-caption text-neutral-text-2">
                                                <Check className="h-3.5 w-3.5 text-success-fg shrink-0" />
                                                <span>{perk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-2 border-t border-neutral-line pt-4 mt-auto">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    leftIcon={offer.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    onClick={() => handleToggleActive(offer)}
                                >
                                    {offer.active ? "Hide Pack" : "Publish Pack"}
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    fullWidth
                                    leftIcon={<Edit3 className="h-4 w-4" />}
                                    onClick={() => handleEditClick(offer)}
                                >
                                    Edit Details
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* EDIT PRICE MODAL */}
            <Modal
                open={selectedOffer !== null}
                onClose={() => setSelectedOffer(null)}
                title="Edit Pricing Package"
            >
                {selectedOffer && (
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 max-w-xl font-sans mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="Package Name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                            />
                            <TextField
                                label="Price (THB)"
                                type="number"
                                value={formPrice}
                                onChange={(e) => setFormPrice(parseInt(e.target.value, 10))}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="Validity (Days)"
                                type="number"
                                value={formValidity}
                                onChange={(e) => setFormValidity(parseInt(e.target.value, 10))}
                                required
                            />
                            <TextField
                                label="Sort Order"
                                type="number"
                                value={formSortOrder}
                                onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10))}
                                hint="Lower number displays first"
                                required
                            />
                        </div>

                        <TextField
                            label="Tagline / Description slogan"
                            value={formTagline}
                            onChange={(e) => setFormTagline(e.target.value)}
                            required
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">
                                Included Perks (One per line)
                            </label>
                            <textarea
                                value={formPerksStr}
                                onChange={(e) => setFormPerksStr(e.target.value)}
                                rows={4}
                                className="w-full p-3 text-body-sm rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                                placeholder="E.g. Full mat access&#10;Complimentary water&#10;1 month validity"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-neutral-line pt-4">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formActive}
                                    onChange={(e) => setFormActive(e.target.checked)}
                                    className="h-5 w-5 rounded border-neutral-line text-primary-500 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-body-sm font-semibold text-neutral-ink">Active (Published)</span>
                                    <span className="text-[10px] text-neutral-text-3">Show in member store list</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formHighlight}
                                    onChange={(e) => setFormHighlight(e.target.checked)}
                                    className="h-5 w-5 rounded border-neutral-line text-primary-500 focus:ring-primary-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-body-sm font-semibold text-neutral-ink">Highlight / Feature</span>
                                    <span className="text-[10px] text-neutral-text-3">Add 'Best Value' label</span>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-2 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelectedOffer(null)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={submitting}
                                disabled={submitting}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
