"use client";

import { Button, Card, TextField } from "@/components/ui";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
    email: z.string().trim().email("Enter a valid email address"),
});

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const parsed = ForgotPasswordSchema.safeParse({ email });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: parsed.data.email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }
            setMessage(
                data.message ||
                    "If an account exists for that email, a password reset link has been sent.",
            );
        } catch {
            setError("Unable to connect to the server. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-neutral-bg px-4 py-12 font-sans">
            <Card elevation="lg" className="w-full max-w-md p-8 flex flex-col gap-6 border border-neutral-line">
                <div className="flex flex-col items-center gap-3 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
                        <MailCheck className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <h1 className="font-display text-h2 font-semibold text-neutral-ink">
                        Reset your password
                    </h1>
                    <p className="text-body-sm text-neutral-text-2">
                        Enter the email address on your MiTR account and we&apos;ll send you a
                        link to reset your password.
                    </p>
                </div>

                {message ? (
                    <div className="rounded-lg bg-green-50 p-3 text-caption text-green-700 border border-green-200">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        <TextField
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputMode="email"
                            autoComplete="email"
                            required
                            errorText={error ?? undefined}
                        />
                        <Button type="submit" loading={loading} fullWidth>
                            Send reset link
                        </Button>
                    </form>
                )}

                <Link
                    href="/"
                    className="text-center font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
                >
                    Back to sign in
                </Link>
            </Card>
        </div>
    );
}
