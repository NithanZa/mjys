"use client";

import type { Liff } from "@line/liff";
import { isStandaloneMode } from "@/lib/auth/mode";
import { startLiffLogin, startServerSession } from "@/lib/liff/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initLiff } from "./client";

/** "ready" means LIFF initialized and any LINE login was exchanged for a session cookie. */
type LiffStatus = "loading" | "ready" | "error";

interface LiffContextValue {
    liff: Liff | null;
    status: LiffStatus;
    error: string | null;
    isInClient: boolean;
    login: () => void;
}

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liff, setLiff] = useState<Liff | null>(null);
    const [status, setStatus] = useState<LiffStatus>(
        isStandaloneMode ? "ready" : "loading",
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isStandaloneMode) return;

        let cancelled = false;
        initLiff()
            .then(async (instance) => {
                await startServerSession(instance).catch((err: unknown) => {
                    console.error("[liff] session exchange failed:", err);
                });
                if (cancelled) return;
                setLiff(instance);
                setStatus("ready");
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Unknown LIFF error");
                setStatus("error");
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(() => {
        if (isStandaloneMode) return;
        if (liff) {
            startLiffLogin(liff);
            return;
        }
        void initLiff()
            .then(startLiffLogin)
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Unknown LIFF error");
                setStatus("error");
            });
    }, [liff]);

    const value = useMemo<LiffContextValue>(
        () => ({
            liff,
            status,
            error,
            isInClient: liff?.isInClient() ?? false,
            login,
        }),
        [liff, status, error, login],
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
