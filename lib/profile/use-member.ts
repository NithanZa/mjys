"use client";

import { isStandaloneMode } from "@/lib/auth/mode";
import { useLiff } from "@/lib/liff";
import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
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

/**
 * Who is using the app. `signedOut` has no session; `unregistered` is signed in
 * with LINE but has no member profile yet.
 */
export type Account =
    | { kind: "loading" }
    | { kind: "signedOut" }
    | { kind: "unregistered" }
    | { kind: "member"; member: Member };

export interface UseMemberResult {
    account: Account;
    member: Member | null;
    loading: boolean;
    error: string | null;
    /** The visitor chose to browse without signing in for this session. */
    browsingAsGuest: boolean;
    continueAsGuest: () => void;
    requestSignIn: () => void;
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
const GUEST_KEY = "mjys.browsingAsGuest";
const MemberContext = createContext<UseMemberResult | null>(null);

function readGuestFlag(): boolean {
    try {
        return typeof window !== "undefined" && sessionStorage.getItem(GUEST_KEY) === "1";
    } catch {
        return false;
    }
}

function writeGuestFlag(value: boolean): void {
    try {
        if (value) sessionStorage.setItem(GUEST_KEY, "1");
        else sessionStorage.removeItem(GUEST_KEY);
    } catch {
        /* private mode: the choice lasts until reload */
    }
}

function useMemberState(): UseMemberResult {
    const { liff, status } = useLiff();
    const [account, setAccount] = useState<Account>({ kind: "loading" });
    const [error, setError] = useState<string | null>(null);
    const [browsingAsGuest, setBrowsingAsGuest] = useState(readGuestFlag);

    const setMember = useCallback((member: Member) => {
        setAccount({ kind: "member", member });
    }, []);

    const fetchAccount = useCallback(async () => {
        try {
            const res = await fetch("/api/members/me", { cache: "no-store" });
            if (res.status === 401) {
                setAccount({ kind: "signedOut" });
                return;
            }
            if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
            const data = (await res.json()) as { member: Member | null };
            const lineUserId = liff?.isLoggedIn() ? liff.getDecodedIDToken()?.sub : undefined;
            if (data.member && lineUserId && data.member.lineUserId !== lineUserId) {
                // The cookie belongs to someone else who used this browser before.
                await fetch("/api/auth/logout", { method: "POST" });
                setAccount({ kind: "signedOut" });
                return;
            }
            if (data.member) setMember(data.member);
            else setAccount({ kind: isStandaloneMode ? "signedOut" : "unregistered" });
            setError(null);
        } catch (err: any) {
            setError(err.message || "An error occurred");
            setAccount({ kind: "signedOut" });
        }
    }, [liff, setMember]);

    useEffect(() => {
        if (status === "loading") return;
        void fetchAccount();
    }, [fetchAccount, status]);

    const continueAsGuest = useCallback(() => {
        writeGuestFlag(true);
        setBrowsingAsGuest(true);
    }, []);

    const requestSignIn = useCallback(() => {
        writeGuestFlag(false);
        setBrowsingAsGuest(false);
    }, []);

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
                const res = await fetch("/api/members", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to register");
                }

                const data = await res.json();
                if (data.unverified) {
                    return data;
                }
                setMember(data.member);
                return data.member;
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [setMember],
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
        [setMember],
    );

    const member = account.kind === "member" ? account.member : null;

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
                const res = await fetch("/api/members", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ celebratedLevels: nextCelebrated }),
                });

                if (!res.ok) throw new Error("Failed to update celebration");

                const data = await res.json();
                setMember(data.member);
            } catch (err) {
                console.error("Failed to mark celebrated:", err);
            }
        },
        [member, setMember],
    );

    const reset = useCallback(async () => {
        if (!isStandaloneMode && DEV) {
            try {
                const res = await fetch("/api/members/reset", { method: "POST" });
                if (res.ok) setAccount({ kind: "unregistered" });
            } catch (err) {
                console.error("Failed to reset account:", err);
            }
            return;
        }

        const res = await fetch("/api/auth/logout", {
            method: "POST",
            cache: "no-store",
        });
        if (!res.ok) {
            throw new Error("Failed to log out");
        }
        if (liff?.isLoggedIn()) liff.logout();
        requestSignIn();
        setAccount({ kind: "signedOut" });
    }, [liff, requestSignIn]);

    const deleteAccount = useCallback(async () => {
        try {
            const res = await fetch("/api/members/me", { method: "DELETE" });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to delete account");
            }

            window.location.href = "/";
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    return {
        account,
        member,
        loading: account.kind === "loading",
        error,
        browsingAsGuest,
        continueAsGuest,
        requestSignIn,
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
