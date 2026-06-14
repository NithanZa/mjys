"use client";

// FRONTEND-ONLY mock member store backed by localStorage.
// Uses useSyncExternalStore — the React-recommended pattern for external stores —
// so it satisfies the React Compiler "no setState in effect" rule and avoids
// hydration mismatches.
// Will be replaced by the real Member API (POST/GET /api/members) once the
// backend pass lands. Shape is kept close to the planned Prisma `Member`.

import { useCallback, useSyncExternalStore } from "react";
import { newlyCrossedThresholds, type Level } from "@/lib/levels";

const STORAGE_KEY = "mjys.member.v1";
const CHANGE_EVENT = "mjys:member-changed";

export interface MockMember {
    id: string;
    lineUserId: string | null;
    displayName: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    tocAccepted: boolean;
    classesAttended: number;
    level: Level;
    celebrated: number[];
    /** Milestone codes already shown on the Home celebration card. */
    seenMilestones: string[];
    createdAt: string;
    updatedAt: string;
}

// ---- snapshot caching --------------------------------------------------------
// useSyncExternalStore requires a stable reference between calls when the
// underlying data hasn't changed. We cache by the raw localStorage string.
let cachedRaw: string | null | undefined = undefined;
let cachedMember: MockMember | null = null;

function readSnapshot(): MockMember | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedMember;
    cachedRaw = raw;
    try {
        cachedMember = raw ? (JSON.parse(raw) as MockMember) : null;
    } catch {
        cachedMember = null;
    }
    return cachedMember;
}

function writeSnapshot(member: MockMember | null) {
    if (typeof window === "undefined") return;
    if (member) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    } else {
        window.localStorage.removeItem(STORAGE_KEY);
    }
    // Bust the cache and notify subscribers in this tab.
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener("storage", callback);
    return () => {
        window.removeEventListener(CHANGE_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
}

const getServerSnapshot = (): MockMember | null => null;

function newId() {
    return "mbr_" + Math.random().toString(36).slice(2, 10);
}

// ---- hook --------------------------------------------------------------------

export interface UseMockMemberResult {
    member: MockMember | null;
    register: (input: {
        displayName: string;
        email: string;
        phone: string;
        dob: string;
        address: string;
        tocAccepted: boolean;
        lineUserId?: string | null;
    }) => MockMember;
    /** Add `delta` classes; returns thresholds that were newly crossed. */
    addClasses: (delta: number) => number[];
    /** Mark a celebration threshold as shown so the toast does not fire again. */
    markCelebrated: (threshold: number) => void;
    /** Mark a milestone code as seen so the Home celebration card is dismissed. */
    markMilestoneSeen: (code: string) => void;
    reset: () => void;
}

export function useMockMember(): UseMockMemberResult {
    const member = useSyncExternalStore(
        subscribe,
        readSnapshot,
        getServerSnapshot,
    );

    const register: UseMockMemberResult["register"] = useCallback((input) => {
        const now = new Date().toISOString();
        const fresh: MockMember = {
            id: newId(),
            lineUserId: input.lineUserId ?? null,
            displayName: input.displayName,
            email: input.email,
            phone: input.phone,
            dob: input.dob,
            address: input.address,
            tocAccepted: input.tocAccepted,
            classesAttended: 0,
            level: "CAT",
            celebrated: [],
            seenMilestones: [],
            createdAt: now,
            updatedAt: now,
        };
        writeSnapshot(fresh);
        return fresh;
    }, []);

    const addClasses: UseMockMemberResult["addClasses"] = useCallback(
        (delta) => {
            const current = readSnapshot();
            if (!current) return [];
            const nextCount = Math.max(0, current.classesAttended + delta);
            const crossed = newlyCrossedThresholds(
                current.classesAttended,
                nextCount,
            );
            writeSnapshot({
                ...current,
                classesAttended: nextCount,
                updatedAt: new Date().toISOString(),
            });
            return crossed;
        },
        [],
    );

    const markCelebrated: UseMockMemberResult["markCelebrated"] = useCallback(
        (threshold) => {
            const current = readSnapshot();
            if (!current) return;
            if (current.celebrated.includes(threshold)) return;
            writeSnapshot({
                ...current,
                celebrated: [...current.celebrated, threshold],
                updatedAt: new Date().toISOString(),
            });
        },
        [],
    );

    const markMilestoneSeen: UseMockMemberResult["markMilestoneSeen"] =
        useCallback((code) => {
            const current = readSnapshot();
            if (!current) return;
            const seen = current.seenMilestones ?? [];
            if (seen.includes(code)) return;
            writeSnapshot({
                ...current,
                seenMilestones: [...seen, code],
                updatedAt: new Date().toISOString(),
            });
        }, []);

    const reset = useCallback(() => {
        writeSnapshot(null);
    }, []);

    return {
        member,
        register,
        addClasses,
        markCelebrated,
        markMilestoneSeen,
        reset,
    };
}
