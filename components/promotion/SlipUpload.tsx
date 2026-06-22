"use client";

import { cn } from "@/lib/cn";
import { ImagePlus, Loader, X } from "lucide-react";
import { useId, useRef, useState } from "react";

export interface SlipUploadProps {
    /** Called when a valid image file is chosen. */
    onSelect: (file: File) => void;
    /** Called when the chosen file is cleared. */
    onClear: () => void;
    /** Whether a submit/upload is currently in flight (shows a spinner overlay). */
    uploading?: boolean;
    className?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic";

/**
 * Customer payment-slip picker with inline preview.
 * Lets a member attach their bank-transfer slip before requesting approval.
 */
export function SlipUpload({
    onSelect,
    onClear,
    uploading = false,
    className,
}: SlipUploadProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleFile(file: File | undefined) {
        if (!file) return;
        setError(null);

        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file (JPG, PNG, or WEBP).");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("That image is over 5 MB. Please choose a smaller file.");
            return;
        }

        setPreview(URL.createObjectURL(file));
        onSelect(file);
    }

    function clear() {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
        onClear();
    }

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {preview ? (
                <div className="relative overflow-hidden rounded-md border border-neutral-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={preview}
                        alt="Payment slip preview"
                        className="max-h-80 w-full object-contain bg-neutral-bg"
                    />
                    {uploading && (
                        <div className="absolute inset-0 grid place-items-center bg-neutral-ink/40">
                            <Loader
                                className="h-8 w-8 animate-spin text-neutral-card"
                                strokeWidth={1.75}
                            />
                        </div>
                    )}
                    {!uploading && (
                        <button
                            type="button"
                            onClick={clear}
                            aria-label="Remove slip"
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-neutral-ink/70 text-neutral-card hover:bg-neutral-ink"
                        >
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                    )}
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-line",
                        "bg-neutral-bg px-4 py-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50",
                    )}
                >
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
                        <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-body-lg font-medium text-neutral-ink">
                        Attach your payment slip
                    </span>
                    <span className="font-sans text-caption text-neutral-text-3">
                        JPG, PNG, or WEBP · up to 5 MB
                    </span>
                </label>
            )}

            {error && (
                <p className="font-sans text-caption text-error-fg">{error}</p>
            )}
        </div>
    );
}
