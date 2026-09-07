"use client";

import { isStandaloneMode } from "@/lib/auth/mode";
import { getLiffAuthHeaders, useLiff } from "@/lib/liff";
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
const MemberContext = createContext<UseMemberResult | null>(null);

function useMemberState(): UseMemberResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const initialFetchStarted = useRef(false);

    const fetchMember = useCallback(async () => {
        if (!isStandaloneMode && (status !== "ready" || !isLoggedIn || !liff)) {
            return;
        }

        try {
            let data: any;
            if (isStandaloneMode) {
                // Cookie is sent automatically by the browser
                const res = await fetch("/api/members/me");
                if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
                data = await res.json();
            } else {
                const res = await fetch("/api/members/me", {
                    headers: getLiffAuthHeaders(liff),
                });
                if (res.status === 401) {
                    throw new Error(
                        "LINE session could not be verified. Reopen this page from LINE, or tap Continue with LINE.",
                    );
                }
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
        if (!isStandaloneMode && (status !== "ready" || !isLoggedIn || !liff)) {
            initialFetchStarted.current = false;
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
                if (isStandaloneMode) {
                    res = await fetch("/api/members", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(input),
                    });
                } else {
                    res = await fetch("/api/members", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...getLiffAuthHeaders(liff),
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
                if (isStandaloneMode) {
                    res = await fetch("/api/members", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ celebratedLevels: nextCelebrated }),
                    });
                } else {
                    res = await fetch("/api/members", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            ...getLiffAuthHeaders(liff),
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
        if (isStandaloneMode) {
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
            const res = await fetch("/api/members/reset", {
                method: "POST",
                headers: getLiffAuthHeaders(liff),
            });
            if (res.ok) {
                setMember(null);
            }
        } catch (err) {
            console.error("Failed to reset account:", err);
        }
    }, [liff]);

    const deleteAccount = useCallback(async () => {
        setLoading(true);
        try {
            let res: Response;
            if (isStandaloneMode) {
                res = await fetch("/api/members/me", {
                    method: "DELETE",
                });
            } else {
                res = await fetch("/api/members/me", {
                    method: "DELETE",
                    headers: getLiffAuthHeaders(liff),
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

    const liffSessionReady =
        isStandaloneMode || (status === "ready" && isLoggedIn && !!liff);

    return {
        member: liffSessionReady ? member : null,
        loading: liffSessionReady ? loading : false,
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
