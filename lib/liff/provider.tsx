"use client";

import type { Liff } from "@line/liff";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initLiff } from "./client";

type LiffStatus = "loading" | "ready" | "error";

interface LiffContextValue {
    liff: Liff | null;
    status: LiffStatus;
    error: string | null;
    isInClient: boolean;
    isLoggedIn: boolean;
}

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liff, setLiff] = useState<Liff | null>(null);
    const [status, setStatus] = useState<LiffStatus>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        initLiff()
            .then((instance) => {
                if (cancelled) return;
                setLiff(instance);
                setStatus("ready");
                if (process.env.NODE_ENV !== "production") {
                    console.info(
                        `[liff] ready. inClient=${instance.isInClient()} loggedIn=${instance.isLoggedIn()}`,
                    );
                }
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(
                    err instanceof Error ? err.message : "Unknown LIFF error",
                );
                setStatus("error");
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo<LiffContextValue>(
        () => ({
            liff,
            status,
            error,
            isInClient: liff?.isInClient() ?? false,
            isLoggedIn: liff?.isLoggedIn() ?? false,
        }),
        [liff, status, error],
    );

    return (
        <LiffContext.Provider value={value}>{children}</LiffContext.Provider>
    );
}

export function useLiff(): LiffContextValue {
    const ctx = useContext(LiffContext);
    if (!ctx) {
        throw new Error("useLiff must be used within <LiffProvider>");
    }
    return ctx;
}
