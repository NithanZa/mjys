"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Input";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export interface LoginFormProps {
    onSubmit: (input: LoginInput) => Promise<void>;
    onSwitchToRegister?: () => void;
}

export function LoginForm({ onSubmit, onSwitchToRegister }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitError(null);
        setUnverifiedEmail(null);
        setResendMessage(null);

        const parsed = LoginSchema.safeParse({ email, password });
        if (!parsed.success) {
            const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof LoginInput;
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);
        try {
            await onSubmit(parsed.data);
        } catch (err: any) {
            setSubmitError(err.message || "Invalid email or password.");
            if (err.unverified && err.email) {
                setUnverifiedEmail(err.email);
            }
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-h2 font-medium text-neutral-ink">
                        Welcome to MiTR
                    </h2>
                    <p className="font-sans text-body text-neutral-text-2">
                        Sign in to access your member profile and classes.
                    </p>
                </div>

                {submitError && (
                    <div className="rounded-lg bg-red-50 p-3 text-caption text-red-600 border border-red-200 font-sans flex flex-col gap-2">
                        <span>{submitError}</span>
                        {unverifiedEmail && (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="self-start font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800 disabled:opacity-60"
                            >
                                {resending ? "Sending..." : "Resend verification email"}
                            </button>
                        )}
                    </div>
                )}

                {resendMessage && (
                    <div className="rounded-lg bg-green-50 p-3 text-caption text-green-700 border border-green-200 font-sans">
                        {resendMessage}
                    </div>
                )}

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

                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    errorText={errors.password}
                />

                <Link
                    href="/forgot-password"
                    className="-mt-2 self-end font-sans text-caption font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                >
                    Forgot password?
                </Link>

                <Button type="submit" loading={submitting} fullWidth>
                    Sign in
                </Button>

                {onSwitchToRegister && (
                    <p className="text-center font-sans text-caption text-neutral-text-2 mt-2">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                        >
                            Create a profile
                        </button>
                    </p>
                )}
            </form>
        </Card>
    );
}
