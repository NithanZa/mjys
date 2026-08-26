"use client";

import { useLiff } from "@/lib/liff";
import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { type Level } from "@/lib/levels";

export interface Member {
    id: string;
    lineUserId: string;
    displayName: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    tocAccepted: boolean;
    classesAttended: number;
    level: Level;
    celebratedLevels: Level[];
    createdAt: string;
    updatedAt: string;
}

export interface UseMemberResult {
    member: Member | null;
    loading: boolean;
    error: string | null;
    register: (input: {
        displayName: string;
        email: string;
        phone: string;
        dob: string;
        address: string;
        tocAccepted: boolean;
        password?: string;
    }) => Promise<any>;
    login: (input: {
        email: string;
        password?: string;
    }) => Promise<Member>;
    markCelebrated: (threshold: number) => Promise<void>;
    reset: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const DEV = process.env.NODE_ENV !== "production";

/** True when the app is running in standalone (non-LINE) mode. */
const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";
const MemberContext = createContext<UseMemberResult | null>(null);

function getRequiredIDToken(liff: any): string {
    const token = liff?.getIDToken();
    if (!token) {
        throw new Error(
            "LINE ID Token is missing (null). Please open your LINE Developers Console, select your LIFF Channel, scroll down to Scopes, and check/enable the 'openid' scope. After enabling, log out of the app and log back in to grant permissions."
        );
    }
    return token;
}

function useMemberState(): UseMemberResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const initialFetchStarted = useRef(false);

    const fetchMember = useCallback(async () => {
        if (!isStandalone && (status !== "ready" || !isLoggedIn || !liff)) {
            setMember(null);
            setError("LINE authentication is unavailable. Please open this page from an authenticated LINE session.");
            setLoading(false);
            return;
        }

        try {
            let data: any;
            if (isStandalone) {
                // Cookie is sent automatically by the browser
                const res = await fetch("/api/members/me", {
                    cache: "no-store",
                    credentials: "include",
                });
                if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
                data = await res.json();
            } else {
                if (!liff) {
                    setError("LIFF not initialized");
                    setLoading(false);
                    return;
                }
                const token = liff.getIDToken();
                if (!token) {
                    setError("No LINE ID token available");
                    setLoading(false);
                    return;
                }
                const res = await fetch("/api/members/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
                data = await res.json();
            }
            setMember(data.member);
            setError(null);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, liff, status]);

    useEffect(() => {
        if (!isStandalone && (status !== "ready" || !isLoggedIn || !liff)) {
            return;
        }
        if (initialFetchStarted.current) return;
        initialFetchStarted.current = true;
        void fetchMember();
    }, [fetchMember, isLoggedIn, liff, status]);

    const register = useCallback(
        async (input: {
            displayName: string;
            email: string;
            phone: string;
            dob: string;
            address: string;
            tocAccepted: boolean;
            password?: string;
        }) => {
            try {
                let res: Response;
                if (isStandalone) {
                    res = await fetch("/api/members", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(input),
                    });
                } else {
                    const token = getRequiredIDToken(liff);
                    res = await fetch("/api/members", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(input),
                    });
                }

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to register");
                }

                const data = await res.json();
                if (data.unverified) {
                    setMember(null);
                    return data;
                }
                setMember(data.member);
                return data.member;
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [liff],
    );

    const login = useCallback(
        async (input: { email: string; password?: string }) => {
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    const err = new Error(errData.error || "Failed to log in") as Error & {
                        unverified?: boolean;
                        email?: string;
                    };
                    err.unverified = errData.unverified;
                    err.email = errData.email;
                    throw err;
                }

                const data = await res.json();
                setMember(data.member);
                return data.member;
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [],
    );

    const markCelebrated = useCallback(
        async (threshold: number) => {
            if (!member) return;
            const levelMap: Record<number, Level> = {
                20: "TIGER",
                50: "LEOPARD",
            };
            const crossedLevel = levelMap[threshold];
            if (!crossedLevel) return;

            const nextCelebrated = [...member.celebratedLevels, crossedLevel];

            try {
                let res: Response;
                if (isStandalone) {
                    res = await fetch("/api/members", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ celebratedLevels: nextCelebrated }),
                    });
                } else {
                    const token = getRequiredIDToken(liff);
                    res = await fetch("/api/members", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ celebratedLevels: nextCelebrated }),
                    });
                }

                if (!res.ok) throw new Error("Failed to update celebration");

                const data = await res.json();
                setMember(data.member);
            } catch (err) {
                console.error("Failed to mark celebrated:", err);
            }
        },
        [member, liff],
    );

    const reset = useCallback(async () => {
        if (isStandalone) {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                cache: "no-store",
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error("Failed to log out");
            }
            setMember(null);
            return;
        }

        if (!DEV) {
            if (!liff) throw new Error("LIFF is not initialized");
            liff.logout();
            setMember(null);
            return;
        }

        try {
            const token = getRequiredIDToken(liff);
            const res = await fetch("/api/members/reset", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setMember(null);
                return;
            }
            throw new Error("Failed to reset account");
        } catch (err) {
            console.error("Failed to reset account:", err);
            throw err;
        }
    }, [liff]);

    const deleteAccount = useCallback(async () => {
        setLoading(true);
        try {
            let res: Response;
            if (isStandalone) {
                res = await fetch("/api/members/me", {
                    method: "DELETE",
                });
            } else {
                const token = getRequiredIDToken(liff);
                res = await fetch("/api/members/me", {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to delete account");
            }

            setMember(null);
            window.location.href = "/";
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [liff]);

    return {
        member,
        loading,
        error,
        register,
        login,
        markCelebrated,
        reset,
        deleteAccount,
    };
}

export function MemberProvider({ children }: { children: ReactNode }) {
    const value = useMemberState();
    return createElement(MemberContext.Provider, { value }, children);
}

export function useMember(): UseMemberResult {
    const value = useContext(MemberContext);
    if (!value) {
        throw new Error("useMember must be used within MemberProvider");
    }
    return value;
}
