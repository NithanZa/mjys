"use client";

import type { Liff } from "@line/liff";
import { isStandaloneMode } from "@/lib/auth/mode";
import {
    clearLiffLoginAttempt,
    hasAttemptedLiffLogin,
    startLiffLogin,
} from "@/lib/liff/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initLiff } from "./client";

type LiffStatus = "loading" | "ready" | "error";

interface LiffContextValue {
    liff: Liff | null;
    status: LiffStatus;
    error: string | null;
    isInClient: boolean;
    isLoggedIn: boolean;
    login: () => void;
}

const LiffContext = createContext<LiffContextValue | null>(null);

const MISSING_OPENID_MESSAGE =
    "LINE ID Token is missing. Enable the openid scope on this LIFF channel in LINE Developers Console, then tap Continue with LINE.";

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liff, setLiff] = useState<Liff | null>(null);
    const [status, setStatus] = useState<LiffStatus>(
        isStandaloneMode ? "ready" : "loading",
    );
    const [error, setError] = useState<string | null>(null);

    const finishReady = useCallback((instance: Liff) => {
        clearLiffLoginAttempt();
        setLiff(instance);
        setError(null);
        setStatus("ready");
        if (process.env.NODE_ENV !== "production") {
            console.info(
                `[liff] ready. inClient=${instance.isInClient()} loggedIn=${instance.isLoggedIn()}`,
            );
        }
    }, []);

    const requireLogin = useCallback((instance: Liff, reason: string) => {
        if (hasAttemptedLiffLogin()) {
            setLiff(instance);
            setError(reason);
            setStatus("error");
            return;
        }
        startLiffLogin(instance);
    }, []);

    useEffect(() => {
        if (isStandaloneMode) {
            console.info("[liff] standalone mode — skipping LIFF init");
            return;
        }

        let cancelled = false;
        initLiff()
            .then((instance) => {
                if (cancelled) return;
                if (!instance.isLoggedIn()) {
                    requireLogin(
                        instance,
                        "Sign in with LINE to continue. Open this page from the LINE app, or tap Continue with LINE.",
                    );
                    return;
                }
                if (!instance.getIDToken()) {
                    requireLogin(instance, MISSING_OPENID_MESSAGE);
                    return;
                }
                finishReady(instance);
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
    }, [finishReady, requireLogin]);

    const login = useCallback(() => {
        if (isStandaloneMode) return;
        if (liff) {
            startLiffLogin(liff);
            return;
        }
        setStatus("loading");
        setError(null);
        void initLiff()
            .then((instance) => {
                startLiffLogin(instance);
            })
            .catch((err: unknown) => {
                setError(
                    err instanceof Error ? err.message : "Unknown LIFF error",
                );
                setStatus("error");
            });
    }, [liff]);

    const value = useMemo<LiffContextValue>(
        () => ({
            liff,
            status,
            error,
            isInClient: liff?.isInClient() ?? false,
            isLoggedIn: liff?.isLoggedIn() ?? false,
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
