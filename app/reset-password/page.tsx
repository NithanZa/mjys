"use client";

import { Button, Card, TextField } from "@/components/ui";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { z } from "zod";

const ResetPasswordSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenHash = searchParams.get("token_hash");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);

        if (!tokenHash) {
            setSubmitError("This reset link is missing required information. Please request a new one.");
            return;
        }

        const parsed = ResetPasswordSchema.safeParse({ password, confirmPassword });
        if (!parsed.success) {
            const fieldErrors: { password?: string; confirmPassword?: string } = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as "password" | "confirmPassword";
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }
        setErrors({});

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token_hash: tokenHash, password: parsed.data.password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setSubmitError(data.error || "Failed to reset password.");
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push("/"), 2000);
        } catch {
            setSubmitError("Unable to connect to the server. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card elevation="lg" className="w-full max-w-md p-8 flex flex-col gap-6 border border-neutral-line">
            <div className="flex flex-col items-center gap-3 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
                    <KeyRound className="h-6 w-6" strokeWidth={2} />
                </span>
                <h1 className="font-display text-h2 font-semibold text-neutral-ink">
                    Choose a new password
                </h1>
                <p className="text-body-sm text-neutral-text-2">
                    Enter and confirm your new password below.
                </p>
            </div>

            {!tokenHash && (
                <div className="rounded-lg bg-red-50 p-3 text-caption text-red-600 border border-red-200">
                    This reset link is invalid or incomplete. Please request a new one from the{" "}
                    <Link href="/forgot-password" className="underline underline-offset-2">
                        forgot password
                    </Link>{" "}
                    page.
                </div>
            )}

            {success ? (
                <div className="rounded-lg bg-green-50 p-3 text-caption text-green-700 border border-green-200">
                    Password updated! Redirecting you to sign in...
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                    {submitError && (
                        <div className="rounded-lg bg-red-50 p-3 text-caption text-red-600 border border-red-200">
                            {submitError}
                        </div>
                    )}
                    <TextField
                        label="New password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        errorText={errors.password}
                    />
                    <TextField
                        label="Confirm new password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        errorText={errors.confirmPassword}
                    />
                    <Button type="submit" loading={loading} fullWidth disabled={!tokenHash}>
                        Update password
                    </Button>
                </form>
            )}
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-neutral-bg px-4 py-12 font-sans">
            <Suspense fallback={null}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
