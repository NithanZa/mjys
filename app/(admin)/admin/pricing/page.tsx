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
    discountPriceTHB: number | null;
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
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Delete modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
    const [deleteAction, setDeleteAction] = useState<"CASCADE" | "MOVE">("CASCADE");
    const [targetOfferId, setTargetOfferId] = useState<string>("");

    // Form states
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState("CLASSES_5");
    const [formPrice, setFormPrice] = useState(0);
    const [formDiscountPrice, setFormDiscountPrice] = useState<number | "">("");
    const [formClassCount, setFormClassCount] = useState<number | "">(5);
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

    const handleAddClick = () => {
        setFormName("");
        setFormType("CLASSES_5");
        setFormPrice(0);
        setFormDiscountPrice("");
        setFormClassCount(5);
        setFormTagline("");
        setFormPerksStr("");
        setFormValidity(30);
        setFormActive(true);
        setFormHighlight(false);
        setFormSortOrder(0);
        setAddModalOpen(true);
    };

    const handleEditClick = (offer: Offer) => {
        setSelectedOffer(offer);
        setFormName(offer.name);
        setFormType(offer.type);
        setFormPrice(offer.priceTHB);
        setFormDiscountPrice(offer.discountPriceTHB ?? "");
        setFormClassCount(offer.classCount ?? "");
        setFormTagline(offer.tagline);
        setFormPerksStr(offer.perks.join("\n"));
        setFormValidity(offer.validityDays);
        setFormActive(offer.active);
        setFormHighlight(offer.highlight);
        setFormSortOrder(offer.sortOrder);
    };

    const handleDeleteClick = (offer: Offer) => {
        setOfferToDelete(offer);
        setDeleteAction("CASCADE");
        
        // Default target is the first package that is NOT the one being deleted
        const candidates = offers.filter((o) => o.id !== offer.id);
        if (candidates.length > 0) {
            setTargetOfferId(candidates[0].id);
        } else {
            setTargetOfferId("");
        }
        
        setDeleteModalOpen(true);
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

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const perks = formPerksStr
                .split("\n")
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

            const res = await fetch("/api/admin/packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    type: formType,
                    priceTHB: formPrice,
                    discountPriceTHB: formDiscountPrice === "" ? null : parseInt(String(formDiscountPrice), 10),
                    classCount: formType === "UNLIMITED" ? null : (formClassCount === "" ? null : parseInt(String(formClassCount), 10)),
                    validityDays: formValidity,
                    tagline: formTagline,
                    perks,
                    active: formActive,
                    highlight: formHighlight,
                    sortOrder: formSortOrder,
                }),
            });

            if (res.ok) {
                alert("Package offer created successfully!");
                setAddModalOpen(false);
                loadOffers();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to create package offer.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
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
                    type: formType,
                    priceTHB: formPrice,
                    discountPriceTHB: formDiscountPrice === "" ? null : parseInt(String(formDiscountPrice), 10),
                    classCount: formType === "UNLIMITED" ? null : (formClassCount === "" ? null : parseInt(String(formClassCount), 10)),
                    validityDays: formValidity,
                    tagline: formTagline,
                    perks,
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

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offerToDelete) return;

        if (deleteAction === "MOVE" && !targetOfferId) {
            alert("Please select a target package to move members to.");
            return;
        }

        const confirmMsg = deleteAction === "CASCADE"
            ? `Are you absolutely sure you want to delete this package offer "${offerToDelete.name}"?\n\nALL existing member subscriptions on this plan will be DELETED immediately! They will lose access.`
            : `Are you sure you want to move all members currently subscribed to "${offerToDelete.name}" to the new plan, and then delete "${offerToDelete.name}"?`;

        if (!confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/packages/${offerToDelete.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: deleteAction,
                    targetOfferId: deleteAction === "MOVE" ? targetOfferId : null,
                }),
            });

            if (res.ok) {
                alert("Package offer deleted successfully!");
                setDeleteModalOpen(false);
                setOfferToDelete(null);
                loadOffers();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete package offer.");
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                        Pricing & Packs
                    </h1>
                    <p className="text-body-sm text-neutral-text-2">
                        Manage studio package rates, taglines, perks, and toggle active status on the client-facing shop.
                    </p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus className="h-5 w-5" />}
                    onClick={handleAddClick}
                >
                    Add Package
                </Button>
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
                                        Display Order #{offer.sortOrder} · {offer.type}
                                    </span>
                                    <h2 className="font-display text-h2 font-bold text-neutral-ink mt-0.5">
                                        {offer.name}
                                    </h2>
                                    <p className="font-sans text-caption text-neutral-text-2 italic mt-1 leading-normal">
                                        &ldquo;{offer.tagline}&rdquo;
                                    </p>
                                </div>

                                <div className="flex items-baseline gap-2 pt-1.5 border-t border-neutral-line/60 flex-wrap">
                                    {offer.discountPriceTHB != null && offer.discountPriceTHB < offer.priceTHB ? (
                                        <>
                                            <span className="font-display text-display-sm font-extrabold text-primary-600">
                                                ฿{offer.discountPriceTHB.toLocaleString()}
                                            </span>
                                            <span className="font-sans text-body-sm text-neutral-text-3 line-through">
                                                ฿{offer.priceTHB.toLocaleString()}
                                            </span>
                                            <Badge tone="primary" className="text-[10px] font-semibold uppercase">
                                                Sale
                                            </Badge>
                                        </>
                                    ) : (
                                        <span className="font-display text-display-sm font-extrabold text-neutral-ink">
                                            ฿{offer.priceTHB.toLocaleString()}
                                        </span>
                                    )}
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

                            <div className="flex gap-2 border-t border-neutral-line pt-4 mt-auto items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(offer)}
                                    className="hover:bg-error-bg hover:text-error-fg shrink-0 p-2 text-neutral-text-3 border border-neutral-line"
                                    title="Delete Package"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    leftIcon={offer.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    onClick={() => handleToggleActive(offer)}
                                >
                                    {offer.active ? "Hide" : "Publish"}
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

            {/* ADD PRICE MODAL */}
            <Modal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                title="Create Pricing Package"
            >
                <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 max-w-xl font-sans mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Package Name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="E.g. 5-Class Pack"
                            required
                        />
                        <TextField
                            label="Price (THB)"
                            type="number"
                            value={formPrice}
                            onChange={(e) => setFormPrice(parseInt(e.target.value, 10))}
                            placeholder="Price in Baht"
                            required
                        />
                        <TextField
                            label="Discount Price (THB)"
                            type="number"
                            value={formDiscountPrice}
                            onChange={(e) => setFormDiscountPrice(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                            placeholder="Optional"
                            hint="Leave empty for no discount"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Package Type</label>
                            <select
                                required
                                value={formType}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormType(val);
                                    if (val === "CLASSES_5") setFormClassCount(5);
                                    else if (val === "CLASSES_10") setFormClassCount(10);
                                    else if (val === "CLASSES_20") setFormClassCount(20);
                                    else if (val === "WALK_IN") setFormClassCount(1);
                                    else if (val === "UNLIMITED") setFormClassCount("");
                                }}
                                className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                            >
                                <option value="CLASSES_5">5 Classes</option>
                                <option value="CLASSES_10">10 Classes</option>
                                <option value="CLASSES_20">20 Classes</option>
                                <option value="UNLIMITED">Unlimited Classes</option>
                                <option value="WALK_IN">Walk-in (1 Class)</option>
                            </select>
                        </div>

                        {formType !== "UNLIMITED" ? (
                            <TextField
                                label="Class Count"
                                type="number"
                                value={formClassCount}
                                onChange={(e) => setFormClassCount(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                                required
                            />
                        ) : (
                            <div className="flex flex-col gap-1.5 justify-end">
                                <label className="text-caption font-medium text-neutral-text-2">Class Count</label>
                                <div className="h-11 flex items-center px-3 bg-neutral-bg border border-neutral-line rounded-sm text-neutral-text-3 text-body-sm italic">
                                    Unlimited (Null value)
                                </div>
                            </div>
                        )}
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
                        placeholder="E.g. Valid for all regular yoga sessions"
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
                            placeholder="E.g. Full mat access&#10;Complimentary water&#10;30 days validity"
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
                            onClick={() => setAddModalOpen(false)}
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
                            Create Package
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* EDIT PRICE MODAL */}
            <Modal
                open={selectedOffer !== null}
                onClose={() => setSelectedOffer(null)}
                title="Edit Pricing Package"
            >
                {selectedOffer && (
                    <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 max-w-xl font-sans mt-4">
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
                            <TextField
                                label="Discount Price (THB)"
                                type="number"
                                value={formDiscountPrice}
                                onChange={(e) => setFormDiscountPrice(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                                placeholder="Optional"
                                hint="Leave empty for no discount"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-caption font-medium text-neutral-text-2">Package Type</label>
                                <select
                                    required
                                    value={formType}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormType(val);
                                        if (val === "CLASSES_5") setFormClassCount(5);
                                        else if (val === "CLASSES_10") setFormClassCount(10);
                                        else if (val === "CLASSES_20") setFormClassCount(20);
                                        else if (val === "WALK_IN") setFormClassCount(1);
                                        else if (val === "UNLIMITED") setFormClassCount("");
                                    }}
                                    className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                                >
                                    <option value="CLASSES_5">5 Classes</option>
                                    <option value="CLASSES_10">10 Classes</option>
                                    <option value="CLASSES_20">20 Classes</option>
                                    <option value="UNLIMITED">Unlimited Classes</option>
                                    <option value="WALK_IN">Walk-in (1 Class)</option>
                                </select>
                            </div>

                            {formType !== "UNLIMITED" ? (
                                <TextField
                                    label="Class Count"
                                    type="number"
                                    value={formClassCount}
                                    onChange={(e) => setFormClassCount(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                                    required
                                />
                            ) : (
                                <div className="flex flex-col gap-1.5 justify-end">
                                    <label className="text-caption font-medium text-neutral-text-2">Class Count</label>
                                    <div className="h-11 flex items-center px-3 bg-neutral-bg border border-neutral-line rounded-sm text-neutral-text-3 text-body-sm italic">
                                        Unlimited (Null value)
                                    </div>
                                </div>
                            )}
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

            {/* DELETE MODAL WITH MEMBERSHIP MIGRATION / CASCADE OPTIONS */}
            <Modal
                open={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setOfferToDelete(null);
                }}
                title={`Delete Package: ${offerToDelete?.name ?? ""}`}
            >
                {offerToDelete && (
                    <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-5 max-w-xl font-sans mt-4">
                        <div className="flex gap-3 items-start p-3.5 rounded-sm bg-warning-bg/20 border border-warning-line/40 text-neutral-ink">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-warning-fg mt-0.5" />
                            <div className="flex flex-col gap-1 text-body-sm text-neutral-text">
                                <p className="font-semibold text-neutral-ink">Warning: This package offer will be permanently removed.</p>
                                <p>You must decide how to handle members who are currently on this plan, or who have pending purchase slips.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-caption font-bold text-neutral-ink uppercase tracking-wider">
                                Subscriptions & Slips Handling
                            </label>
                            
                            <div className="flex flex-col gap-3">
                                {/* Option 1: CASCADE */}
                                <label className="flex items-start gap-3 p-3 rounded-md border border-neutral-line bg-neutral-card hover:bg-neutral-bg cursor-pointer select-none transition-colors">
                                    <input
                                        type="radio"
                                        name="deleteAction"
                                        value="CASCADE"
                                        checked={deleteAction === "CASCADE"}
                                        onChange={() => setDeleteAction("CASCADE")}
                                        className="h-5 w-5 mt-0.5 text-primary-500 focus:ring-primary-500"
                                    />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-body-sm font-semibold text-neutral-ink">
                                            Delete all current subscriptions
                                        </span>
                                        <span className="text-caption text-neutral-text-3">
                                            Immediately gets rid of all current members' packages and pending purchases on this plan. Members will lose access to classes.
                                        </span>
                                    </div>
                                </label>

                                {/* Option 2: MOVE (Migrate) */}
                                <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer select-none transition-colors ${
                                    offers.filter(o => o.id !== offerToDelete.id).length === 0
                                        ? "opacity-50 pointer-events-none bg-neutral-bg/60 border-neutral-line"
                                        : "border-neutral-line bg-neutral-card hover:bg-neutral-bg"
                                }`}>
                                    <input
                                        type="radio"
                                        name="deleteAction"
                                        value="MOVE"
                                        disabled={offers.filter(o => o.id !== offerToDelete.id).length === 0}
                                        checked={deleteAction === "MOVE"}
                                        onChange={() => setDeleteAction("MOVE")}
                                        className="h-5 w-5 mt-0.5 text-primary-500 focus:ring-primary-500"
                                    />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-body-sm font-semibold text-neutral-ink">
                                            Move members to another plan
                                        </span>
                                        <span className="text-caption text-neutral-text-3">
                                            Move all current member packages and pending purchases on this plan to another existing plan, preserving their subscriptions.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Migration Dropdown (only visible when MOVE is selected) */}
                        {deleteAction === "MOVE" && (
                            <div className="flex flex-col gap-1.5 animate-fadeIn">
                                <label className="text-caption font-semibold text-neutral-text-2">
                                    Select New Destination Plan
                                </label>
                                <select
                                    required
                                    value={targetOfferId}
                                    onChange={(e) => setTargetOfferId(e.target.value)}
                                    className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                                >
                                    {offers
                                        .filter((o) => o.id !== offerToDelete.id)
                                        .map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name} (฿{o.priceTHB.toLocaleString()} · {o.classCount ?? "Unlimited"} classes)
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-2 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setOfferToDelete(null);
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                loading={submitting}
                                disabled={submitting}
                            >
                                Delete Package
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
