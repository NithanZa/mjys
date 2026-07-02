"use client";

import { useLiff } from "@/lib/liff";
import { useCallback, useEffect, useState } from "react";
import { useMockMember } from "./mock-store";
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
    }) => Promise<Member>;
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

function getRequiredIDToken(liff: any): string {
    const token = liff?.getIDToken();
    if (!token) {
        throw new Error(
            "LINE ID Token is missing (null). Please open your LINE Developers Console, select your LIFF Channel, scroll down to Scopes, and check/enable the 'openid' scope. After enabling, log out of the app and log back in to grant permissions."
        );
    }
    return token;
}

export function useMember(): UseMemberResult {
    const { liff, status, isLoggedIn } = useLiff();
    const mockStore = useMockMember();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // In standalone mode the app uses real APIs with cookie auth — never mock.
    // In LIFF mode fall back to mock when LIFF is not ready or user is not logged in.
    const isMock = isStandalone ? false : status !== "ready" || !isLoggedIn || !liff;

    const fetchMember = useCallback(async () => {
        if (isMock) {
            setLoading(false);
            return;
        }

        try {
            let data: any;
            if (isStandalone) {
                // Cookie is sent automatically by the browser
                const res = await fetch("/api/members/me");
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
    }, [isMock, liff]);

    useEffect(() => {
        fetchMember();
    }, [fetchMember]);

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
            if (isMock) {
                const registeredMock = mockStore.register(input);
                // Map MockMember to Member shape
                const mapped: Member = {
                    ...registeredMock,
                    lineUserId: registeredMock.lineUserId ?? "",
                    celebratedLevels: registeredMock.celebrated.map((t) =>
                        t === 20 ? "TIGER" : t === 50 ? "LEOPARD" : "CAT",
                    ),
                };
                return mapped;
            }

            setLoading(true);
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
                setMember(data.member);
                return data.member;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isMock, liff, mockStore],
    );

    const login = useCallback(
        async (input: { email: string; password?: string }) => {
            if (isMock) {
                // In mock mode (e.g. dev outside LINE and standalone is false), just mock-register or mock-login
                const mockReg = mockStore.register({
                    displayName: "Mock Member",
                    email: input.email,
                    phone: "0812345678",
                    dob: "2000-01-01",
                    address: "123 Mock Lane",
                    tocAccepted: true,
                });
                const mapped: Member = {
                    ...mockReg,
                    lineUserId: mockReg.lineUserId ?? "",
                    celebratedLevels: mockReg.celebrated.map((t) =>
                        t === 20 ? "TIGER" : t === 50 ? "LEOPARD" : "CAT",
                    ),
                };
                return mapped;
            }

            setLoading(true);
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to log in");
                }

                const data = await res.json();
                setMember(data.member);
                return data.member;
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isMock, mockStore],
    );

    const markCelebrated = useCallback(
        async (threshold: number) => {
            if (isMock) {
                mockStore.markCelebrated(threshold);
                return;
            }

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
        [isMock, member, mockStore, liff],
    );

    const reset = useCallback(async () => {
        if (isMock) {
            mockStore.reset();
            return;
        }
        if (isStandalone) {
            try {
                const res = await fetch("/api/auth/logout", {
                    method: "POST",
                });
                if (res.ok) {
                    setMember(null);
                }
            } catch (err) {
                console.error("Failed to log out:", err);
            }
            return;
        }

        if (!DEV) return;
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
            }
        } catch (err) {
            console.error("Failed to reset account:", err);
        }
    }, [isMock, mockStore, liff]);

    const deleteAccount = useCallback(async () => {
        if (isMock) {
            mockStore.reset();
            setMember(null);
            return;
        }

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
    }, [isMock, isStandalone, liff, mockStore]);

    const activeMember = isMock
        ? mockStore.member
            ? {
                  ...mockStore.member,
                  lineUserId: mockStore.member.lineUserId ?? "",
                  celebratedLevels: mockStore.member.celebrated.map((t) =>
                      t === 20 ? "TIGER" : t === 50 ? "LEOPARD" : "CAT",
                  ) as Level[],
              }
            : null
        : member;

    const activeLoading = isMock ? false : loading;

    return {
        member: activeMember,
        loading: activeLoading,
        error,
        register,
        login,
        markCelebrated,
        reset,
        deleteAccount,
    };
}
