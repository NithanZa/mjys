"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Input";
import { useState, type FormEvent } from "react";
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

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitError(null);

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
        } finally {
            setSubmitting(false);
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
                    <div className="rounded-lg bg-red-50 p-3 text-caption text-red-600 border border-red-200 font-sans">
                        {submitError}
                    </div>
                )}

                <TextField
                    label="Email address"
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

                <Button type="submit" loading={submitting} fullWidth>
                    Sign in
                </Button>

                {onSwitchToRegister && (
                    <p className="text-center font-sans text-caption text-neutral-text-2 mt-2">
                        Don't have an account?{" "}
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
