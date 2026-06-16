"use client";

import { useLiff } from "@/lib/liff";
import { useCallback, useEffect, useState } from "react";
import { useMockMember } from "./mock-store";
import { newlyCrossedThresholds, type Level } from "@/lib/levels";

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
    }) => Promise<Member>;
    addClasses: (delta: number) => Promise<number[]>;
    markCelebrated: (threshold: number) => Promise<void>;
    reset: () => Promise<void>;
}

const DEV = process.env.NODE_ENV !== "production";

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

    // Use mock fallback when not running inside LINE client or not logged in
    const isMock = status !== "ready" || !isLoggedIn || !liff;

    const fetchMember = useCallback(async () => {
        if (isMock) {
            setLoading(false);
            return;
        }

        try {
            const token = liff.getIDToken();
            if (!token) {
                setError("No LINE ID token available");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/members/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch profile: ${res.statusText}`);
            }

            const data = await res.json();
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
                const token = getRequiredIDToken(liff);
                const res = await fetch("/api/members", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(input),
                });

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

    const addClasses = useCallback(
        async (delta: number) => {
            if (isMock) {
                return mockStore.addClasses(delta);
            }

            if (!member) return [];

            const nextCount = Math.max(0, member.classesAttended + delta);
            const crossed = newlyCrossedThresholds(
                member.classesAttended,
                nextCount,
            );

            try {
                const token = getRequiredIDToken(liff);
                const res = await fetch("/api/members", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        classesAttended: nextCount,
                    }),
                });

                if (!res.ok) throw new Error("Failed to update classes");

                const data = await res.json();
                setMember(data.member);
                return crossed;
            } catch (err: any) {
                console.error("Failed to update classes:", err);
                return [];
            }
        },
        [isMock, member, mockStore, liff],
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
                const token = getRequiredIDToken(liff);
                const res = await fetch("/api/members", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        celebratedLevels: nextCelebrated,
                    }),
                });

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
        addClasses,
        markCelebrated,
        reset,
    };
}
