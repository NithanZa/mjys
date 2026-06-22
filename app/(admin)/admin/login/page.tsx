"use client";

import { Button, Card, TextField } from "@/components/ui";
import { KeyRound, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [passphrase, setPassphrase] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!passphrase) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passphrase }),
            });

            if (res.ok) {
                router.push("/admin");
            } else {
                const data = await res.json();
                setError(data.error || "Incorrect passphrase. Please try again.");
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError("Unable to connect to the server. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-bg px-4 py-12 font-sans">
            <Card elevation="lg" className="w-full max-w-md p-8 flex flex-col gap-6 border border-neutral-line">
                <div className="flex flex-col items-center gap-3 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
                        <KeyRound className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                        MiTR Yoga Studio
                    </h1>
                    <p className="text-body-sm text-neutral-text-2">
                        Admin Portal access. Please enter the master passphrase to log in.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <TextField
                        label="Passphrase"
                        type="password"
                        placeholder="Enter admin passphrase"
                        value={passphrase}
                        onChange={(e) => {
                            setPassphrase(e.target.value);
                            setError(null);
                        }}
                        leftIcon={<KeyRound className="h-4 w-4" />}
                        errorText={error ?? undefined}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                        disabled={!passphrase || loading}
                    >
                        Enter Dashboard
                    </Button>
                </form>

                <div className="flex gap-2 items-start text-caption text-neutral-text-3 border-t border-neutral-line pt-4">
                    <ShieldAlert className="h-4 w-4 mt-0.5 text-neutral-text-3 shrink-0" />
                    <span>
                        This area is restricted to authorized studio personnel only. All access is logged securely.
                    </span>
                </div>
            </Card>
        </div>
    );
}
