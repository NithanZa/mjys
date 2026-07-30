"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button, Card, Badge, Sheet, Modal, Input } from "@/components/ui";
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Loader,
    Upload,
    AlertTriangle,
    Pencil,
    Eye,
    EyeOff,
} from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";

interface HomeBanner {
    id: string;
    title: string;
    eyebrow: string | null;
    imageUrl: string;
    href: string;
    sortOrder: number;
    isActive: boolean;
}

function isExternal(href: string) {
    return /^https?:\/\//i.test(href);
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
): Promise<Blob> {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    // Cap output at 1200px wide to keep file size reasonable
    const maxW = 1200;
    const scale = Math.min(1, maxW / pixelCrop.width);
    const outW = Math.round(pixelCrop.width * scale);
    const outH = Math.round(pixelCrop.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outW,
        outH,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) throw new Error("Failed to export cropped image");
    return blob;
}

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<HomeBanner[]>([]);
    const [loading, setLoading] = useState(true);

    // Add/Edit sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formEyebrow, setFormEyebrow] = useState("");
    const [formHref, setFormHref] = useState("");
    const [formSortOrder, setFormSortOrder] = useState("");
    const [formIsActive, setIsActive] = useState(true);
    const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Crop state
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [uploading, setUploading] = useState(false);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingBanner, setDeletingBanner] = useState<HomeBanner | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadBanners = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/home-banners");
            if (res.ok) {
                const data = await res.json();
                setBanners(data.banners);
            }
        } catch (error) {
            console.error("Failed to load banners:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBanners();
    }, [loadBanners]);

    // --- Add / Edit ---

    function openAddSheet() {
        setEditingBanner(null);
        setFormTitle("");
        setFormEyebrow("");
        setFormHref("");
        setFormSortOrder("");
        setIsActive(true);
        setFormImageUrl(null);
        setCropSrc(null);
        setFormError("");
        setSheetOpen(true);
    }

    function openEditSheet(banner: HomeBanner) {
        setEditingBanner(banner);
        setFormTitle(banner.title);
        setFormEyebrow(banner.eyebrow || "");
        setFormHref(banner.href);
        setFormSortOrder(String(banner.sortOrder));
        setIsActive(banner.isActive);
        setFormImageUrl(banner.imageUrl);
        setCropSrc(null);
        setFormError("");
        setSheetOpen(true);
    }

    function handleFileSelect(file: File) {
        setFormError("");
        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.readAsDataURL(file);
    }

    async function handleCropConfirm() {
        if (!cropSrc || !croppedAreaPixels) return;
        setUploading(true);
        setFormError("");
        try {
            const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
            const formData = new FormData();
            formData.append("file", new File([blob], "banner.jpg", { type: "image/jpeg" }));

            const res = await fetch("/api/admin/home-banners/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setFormImageUrl(data.url);
                setCropSrc(null);
            } else {
                const err = await res.json();
                setFormError(err.error || "Failed to upload image.");
            }
        } catch {
            setFormError("Network error during upload.");
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit() {
        const missing: string[] = [];
        if (!formTitle) missing.push("Title");
        if (!formImageUrl) missing.push("Image");
        if (!formHref?.trim()) missing.push("Link (href)");
        if (missing.length > 0) {
            setFormError(`Missing required field(s): ${missing.join(", ")}`);
            console.log("[banner-submit] Validation failed:", { formTitle, formImageUrl, formHref });
            return;
        }

        setSubmitting(true);
        setFormError("");

        try {
            const payload: Record<string, unknown> = {
                title: formTitle,
                eyebrow: formEyebrow || null,
                imageUrl: formImageUrl,
                href: formHref.trim(),
                isActive: formIsActive,
            };
            if (formSortOrder) {
                payload.sortOrder = parseInt(formSortOrder, 10);
            }

            if (editingBanner) {
                const res = await fetch(`/api/admin/home-banners/${editingBanner.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json();
                    setFormError(err.error || "Failed to update banner.");
                    setSubmitting(false);
                    return;
                }
            } else {
                const res = await fetch("/api/admin/home-banners", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json();
                    setFormError(err.error || "Failed to create banner.");
                    setSubmitting(false);
                    return;
                }
            }

            setSheetOpen(false);
            loadBanners();
        } catch {
            setFormError("Network error.");
        } finally {
            setSubmitting(false);
        }
    }

    // --- Inline active toggle ---

    async function handleToggleActive(banner: HomeBanner) {
        try {
            const res = await fetch(`/api/admin/home-banners/${banner.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !banner.isActive }),
            });
            if (res.ok) {
                loadBanners();
            }
        } catch (err) {
            console.error("Failed to toggle banner:", err);
        }
    }

    // --- Delete ---

    function openDeleteModal(banner: HomeBanner) {
        setDeletingBanner(banner);
        setDeleteModalOpen(true);
    }

    async function handleDelete() {
        if (!deletingBanner) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/home-banners/${deletingBanner.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to delete banner.");
            } else {
                setDeleteModalOpen(false);
                setDeletingBanner(null);
                loadBanners();
            }
        } catch {
            alert("Network error.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-100 text-primary-700">
                        <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                        <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                            Home Banners
                        </h1>
                        <p className="text-body-sm text-neutral-text-2">
                            Manage banner cards shown on the home page
                        </p>
                    </div>
                </div>
                <Button
                    onClick={openAddSheet}
                    leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
                >
                    Add Banner
                </Button>
            </div>

            {/* Banner Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader className="h-6 w-6 animate-spin text-neutral-text-3" />
                </div>
            ) : banners.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-neutral-text-2">
                        No banners yet. Click &ldquo;Add Banner&rdquo; to create the first one.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {banners.map((banner) => (
                        <Card key={banner.id} className="overflow-hidden">
                            <div className="relative aspect-[3/2] w-full overflow-hidden bg-primary-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        {banner.eyebrow && (
                                            <p className="text-caption text-neutral-text-3 uppercase tracking-wider truncate">
                                                {banner.eyebrow}
                                            </p>
                                        )}
                                        <p className="font-display text-body-lg font-semibold text-neutral-ink truncate">
                                            {banner.title}
                                        </p>
                                        <p className="text-caption text-primary-600 truncate">
                                            {banner.href}
                                        </p>
                                    </div>
                                    <Badge tone={banner.isActive ? "success" : "neutral"}>
                                        {banner.isActive ? "Active" : "Hidden"}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-caption text-neutral-text-3">
                                    Order: {banner.sortOrder}
                                </p>
                            </div>
                            <div className="flex border-t border-neutral-line">
                                <button
                                    onClick={() => handleToggleActive(banner)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-body-sm font-medium text-neutral-text-2 hover:bg-neutral-line/20 transition-colors"
                                    title={banner.isActive ? "Hide" : "Show"}
                                >
                                    {banner.isActive ? (
                                        <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    ) : (
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    )}
                                </button>
                                <button
                                    onClick={() => openEditSheet(banner)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-body-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors border-l border-neutral-line"
                                >
                                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => openDeleteModal(banner)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-body-sm font-medium text-error-fg hover:bg-error-bg/20 transition-colors border-l border-neutral-line"
                                >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    Delete
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add / Edit Sheet */}
            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={editingBanner ? "Edit Banner" : "Add Banner"}
                height={90}
            >
                <div className="flex flex-col gap-4">
                    {/* Image upload / crop */}
                    <div className="flex flex-col gap-2">
                        <label className="text-caption font-medium text-neutral-text-2">
                            Banner Image *
                        </label>

                        {cropSrc ? (
                            /* Cropper UI */
                            <div className="flex flex-col gap-3">
                                <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-md bg-neutral-ink">
                                    <Cropper
                                        image={cropSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={3 / 2}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                                        objectFit="contain"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-caption text-neutral-text-2">Zoom</label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setCropSrc(null);
                                            setCroppedAreaPixels(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        loading={uploading}
                                        onClick={handleCropConfirm}
                                    >
                                        Crop & Upload
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {formImageUrl && (
                                    <div className="relative h-40 w-full overflow-hidden rounded-md bg-primary-50 border border-neutral-line">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formImageUrl}
                                            alt="Banner preview"
                                            className="object-contain w-full h-full"
                                            onLoad={() => console.log("[banner-preview] loaded:", formImageUrl)}
                                            onError={() => console.error("[banner-preview] failed to load:", formImageUrl)}
                                        />
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                        e.target.value = "";
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    leftIcon={<Upload className="h-4 w-4" />}
                                >
                                    {formImageUrl ? "Replace Image" : "Upload Image"}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">
                            Title *
                        </label>
                        <Input
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Promotion"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">
                            Eyebrow
                        </label>
                        <Input
                            value={formEyebrow}
                            onChange={(e) => setFormEyebrow(e.target.value)}
                            placeholder="Special offers"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">
                            Link (href) *
                        </label>
                        <Input
                            value={formHref}
                            onChange={(e) => setFormHref(e.target.value)}
                            placeholder="/contact or https://example.com"
                        />
                        <span className="text-caption text-neutral-text-3">
                            Starts with <code>/</code> for an internal page, or <code>https://</code> for an external link.
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">
                            Sort Order
                        </label>
                        <Input
                            type="number"
                            value={formSortOrder}
                            onChange={(e) => setFormSortOrder(e.target.value)}
                            placeholder="Auto (next available)"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label
                            htmlFor="banner-active"
                            className="text-caption font-medium text-neutral-text-2 cursor-pointer select-none"
                        >
                            Active
                        </label>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                id="banner-active"
                                type="checkbox"
                                className="peer sr-only"
                                checked={formIsActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <div className="h-6 w-11 rounded-full bg-neutral-line transition-colors peer-checked:bg-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2" />
                            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                        </label>
                    </div>

                    {formError && (
                        <p className="text-body-sm text-error-fg">{formError}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setSheetOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            {editingBanner ? "Save Changes" : "Create Banner"}
                        </Button>
                    </div>
                </div>
            </Sheet>

            {/* Delete Modal */}
            <Modal
                open={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeletingBanner(null);
                }}
                title="Delete Banner"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-body-sm text-neutral-text-2">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-neutral-ink">
                            {deletingBanner?.title}
                        </span>
                        ? This will also remove the image from storage. This action cannot be undone.
                    </p>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setDeletingBanner(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            fullWidth
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
