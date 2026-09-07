"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Input";
import { isStandaloneMode } from "@/lib/auth/mode";
import { useLiff } from "@/lib/liff";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";

const isStandalone = isStandaloneMode;

const RegistrationSchema = z.object({
    displayName: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(60, "Name is too long"),
    email: z.email("Enter a valid email address"),
    phone: z
        .string()
        .trim()
        .regex(/^[0-9+\-\s]{8,20}$/, "Enter a valid phone number"),
    dob: z.string().min(1, "Date of birth is required"),
    address: z.string().trim().min(5, "Please enter your home address"),
    tocAccepted: z.literal(true, {
        error: "You must agree to the Terms & Conditions",
    }),
    password: isStandalone
        ? z.string().min(6, "Password must be at least 6 characters")
        : z.string().optional(),
});

export type RegistrationInput = z.infer<typeof RegistrationSchema>;

export interface RegistrationFormProps {
    onSubmit: (
        input: RegistrationInput & { lineUserId: string | null },
    ) => Promise<any>;
    onSwitchToLogin?: () => void;
}

export function RegistrationForm({
    onSubmit,
    onSwitchToLogin,
}: RegistrationFormProps) {
    const { liff, status, isLoggedIn } = useLiff();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [address, setAddress] = useState("");
    const [tocAccepted, setTocAccepted] = useState(false);
    const [lineUserId, setLineUserId] = useState<string | null>(null);
    const [errors, setErrors] = useState<
        Partial<Record<keyof RegistrationInput, string>>
    >({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    // Pre-fill from LIFF when the LINE session is ready (in-app or external browser).
    useEffect(() => {
        if (status !== "ready" || !liff || !isLoggedIn) return;
        let cancelled = false;
        void liff
            .getProfile()
            .then((profile) => {
                if (cancelled) return;
                setLineUserId(profile.userId);
                setDisplayName((prev) => prev || profile.displayName || "");
            })
            .catch(() => {
                /* ignore — leave fields empty */
            });
        return () => {
            cancelled = true;
        };
    }, [liff, status, isLoggedIn]);

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitError(null);
        setSuccessMessage(null);
        const parsed = RegistrationSchema.safeParse({
            displayName,
            email,
            phone,
            dob,
            address,
            tocAccepted,
            password: isStandalone ? password : undefined,
        });
        if (!parsed.success) {
            const fieldErrors: Partial<
                Record<keyof RegistrationInput, string>
            > = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof RegistrationInput;
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            const result = await onSubmit({ ...parsed.data, lineUserId });
            if (result && result.unverified) {
                setSuccessMessage(result.message || "Profile created. Please check your email to verify your account.");
                setUnverifiedEmail(result.email || email);
            }
        } catch (err: any) {
            setSubmitError(err.message || "Failed to create profile.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResend() {
        if (!unverifiedEmail) return;
        setResending(true);
        setResendMessage(null);
        try {
            const res = await fetch("/api/auth/resend-confirmation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: unverifiedEmail }),
            });
            const data = await res.json();
            setResendMessage(
                res.ok
                    ? data.message || "Confirmation email sent."
                    : data.error || "Failed to resend email.",
            );
        } catch {
            setResendMessage("Failed to resend email.");
        } finally {
            setResending(false);
        }
    }

    return (
        <Card>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
                noValidate
            >
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-h2 font-medium text-neutral-ink">
                        Create your member profile
                    </h2>
                    <p className="font-sans text-body text-neutral-text-2">
                        Fill in your details to create your studio member pass.
                    </p>
                </div>

                {submitError && (
                    <div className="rounded-lg bg-red-50 p-3 text-caption text-red-600 border border-red-200 font-sans">
                        {submitError}
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-lg bg-green-50 p-3 text-caption text-green-700 border border-green-200 font-sans flex flex-col gap-2">
                        <span>{successMessage}</span>
                        {unverifiedEmail && (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="self-start font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800 disabled:opacity-60"
                            >
                                {resending ? "Sending..." : "Didn't get it? Resend email"}
                            </button>
                        )}
                        {resendMessage && <span>{resendMessage}</span>}
                    </div>
                )}

                <TextField
                    label="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    required
                    errorText={errors.displayName}
                />
                <TextField
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                    required
                    errorText={errors.email}
                />
                {isStandalone && (
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        errorText={errors.password}
                    />
                )}
                <TextField
                    label="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    hint="Used for class reminders only."
                    errorText={errors.phone}
                />
                <div className="flex flex-col gap-1">
                    <label className="font-sans text-body font-medium text-neutral-ink">
                        Date of birth{" "}
                        <span aria-hidden className="text-red-500">
                            *
                        </span>
                    </label>
                    <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                        className="w-full rounded-lg border border-neutral-line bg-neutral-bg px-3 py-2.5 font-sans text-body text-neutral-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    {errors.dob && (
                        <p className="font-sans text-caption text-red-600">
                            {errors.dob}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-sans text-body font-medium text-neutral-ink">
                        Home address{" "}
                        <span aria-hidden className="text-red-500">
                            *
                        </span>
                    </label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        required
                        autoComplete="street-address"
                        className="w-full resize-none rounded-lg border border-neutral-line bg-neutral-bg px-3 py-2.5 font-sans text-body text-neutral-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    {errors.address && (
                        <p className="font-sans text-caption text-red-600">
                            {errors.address}
                        </p>
                    )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={tocAccepted}
                        onChange={(e) => setTocAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
                    />
                    <span className="font-sans text-body text-neutral-text-2">
                        I agree to the{" "}
                        <Link
                            href="/terms"
                            className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                            target="_blank"
                        >
                            Terms &amp; Conditions
                        </Link>
                    </span>
                </label>
                {errors.tocAccepted && (
                    <p className="-mt-2 font-sans text-caption text-red-600">
                        {errors.tocAccepted}
                    </p>
                )}

                <Button type="submit" loading={submitting} fullWidth>
                    Create profile
                </Button>

                {onSwitchToLogin && (
                    <p className="text-center font-sans text-caption text-neutral-text-2 mt-2">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                        >
                            Sign in
                        </button>
                    </p>
                )}
            </form>
        </Card>
    );
}
