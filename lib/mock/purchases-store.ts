"use client";

// FRONTEND-ONLY mock purchases store. Combines the planned `PendingPurchase`
// and `Package` tables into a single localStorage-backed list.
// Replaced in the backend pass by:
//   - POST /api/purchases   → creates PendingPurchase
//   - PATCH /api/purchases/:id (admin) → approves and creates Package

import { useCallback, useSyncExternalStore } from "react";
import { addDays } from "date-fns";
import { getPackageOffer, type PackageOffer } from "@/lib/mock/packages";

const STORAGE_KEY = "mjys.purchases.v1";
const CHANGE_EVENT = "mjys:purchases-changed";

export type PurchaseStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED"
    | "EXHAUSTED";

export interface MockPurchase {
    id: string;
    offerId: string;
    status: PurchaseStatus;
    /** Set when status === APPROVED (or beyond). */
    classesRemaining: number | null; // null = unlimited
    expiresAt: string | null; // ISO; null until APPROVED
    createdAt: string;
    reviewedAt: string | null;
}

export interface ActivePackageView {
    purchase: MockPurchase;
    offer: PackageOffer;
    classesRemaining: number | null;
    expiresAt: Date;
    isUnlimited: boolean;
}

let cachedRaw: string | null | undefined = undefined;
let cachedList: MockPurchase[] = [];

function readSnapshot(): MockPurchase[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    try {
        cachedList = raw ? (JSON.parse(raw) as MockPurchase[]) : [];
    } catch {
        cachedList = [];
    }
    return cachedList;
}

function writeSnapshot(list: MockPurchase[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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

const SERVER_SNAPSHOT: MockPurchase[] = [];
const getServerSnapshot = (): MockPurchase[] => SERVER_SNAPSHOT;

function newId() {
    return "pur_" + Math.random().toString(36).slice(2, 10);
}

export interface UsePurchasesResult {
    purchases: MockPurchase[];
    pendingPurchases: MockPurchase[];
    activePackage: ActivePackageView | null;
    /** Create a new PENDING purchase for the given offer. Returns the new purchase id. */
    createPending: (offerId: string) => string;
    /** Simulate studio approval of a PENDING purchase (frontend stub for AC5). */
    approvePending: (purchaseId: string) => void;
    /** Reject a PENDING purchase. */
    rejectPending: (purchaseId: string) => void;
    /** Reset all purchases (dev). */
    reset: () => void;
}

export function usePurchases(): UsePurchasesResult {
    const purchases = useSyncExternalStore(
        subscribe,
        readSnapshot,
        getServerSnapshot,
    );

    const pendingPurchases = purchases.filter((p) => p.status === "PENDING");

    // Pick the most-recently-approved, still-valid package as "active".
    const activePackage = pickActivePackage(purchases);

    const createPending: UsePurchasesResult["createPending"] = useCallback(
        (offerId) => {
            const offer = getPackageOffer(offerId);
            if (!offer) throw new Error(`Unknown package offer: ${offerId}`);
            const purchase: MockPurchase = {
                id: newId(),
                offerId,
                status: "PENDING",
                classesRemaining: null,
                expiresAt: null,
                createdAt: new Date().toISOString(),
                reviewedAt: null,
            };
            writeSnapshot([...readSnapshot(), purchase]);
            return purchase.id;
        },
        [],
    );

    const approvePending: UsePurchasesResult["approvePending"] = useCallback(
        (purchaseId) => {
            const list = readSnapshot();
            const target = list.find((p) => p.id === purchaseId);
            if (!target || target.status !== "PENDING") return;
            const offer = getPackageOffer(target.offerId);
            if (!offer) return;
            const now = new Date();
            const expiresAt = addDays(now, offer.validityDays).toISOString();
            const updated: MockPurchase = {
                ...target,
                status: "APPROVED",
                classesRemaining: offer.classCount, // null for UNLIMITED
                expiresAt,
                reviewedAt: now.toISOString(),
            };
            writeSnapshot(list.map((p) => (p.id === purchaseId ? updated : p)));
        },
        [],
    );

    const rejectPending: UsePurchasesResult["rejectPending"] = useCallback(
        (purchaseId) => {
            const list = readSnapshot();
            const target = list.find((p) => p.id === purchaseId);
            if (!target || target.status !== "PENDING") return;
            writeSnapshot(
                list.map((p) =>
                    p.id === purchaseId
                        ? {
                              ...p,
                              status: "REJECTED",
                              reviewedAt: new Date().toISOString(),
                          }
                        : p,
                ),
            );
        },
        [],
    );

    const reset: UsePurchasesResult["reset"] = useCallback(() => {
        writeSnapshot([]);
    }, []);

    return {
        purchases,
        pendingPurchases,
        activePackage,
        createPending,
        approvePending,
        rejectPending,
        reset,
    };
}

function pickActivePackage(
    purchases: MockPurchase[],
): ActivePackageView | null {
    const now = Date.now();
    const candidates = purchases
        .filter((p) => p.status === "APPROVED")
        .filter((p) => {
            // Must not be expired or exhausted.
            if (p.expiresAt && new Date(p.expiresAt).getTime() < now)
                return false;
            if (p.classesRemaining === 0) return false;
            return true;
        })
        .sort((a, b) => {
            const ar = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
            const br = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
            return br - ar;
        });

    const top = candidates[0];
    if (!top) return null;
    const offer = getPackageOffer(top.offerId);
    if (!offer || !top.expiresAt) return null;
    return {
        purchase: top,
        offer,
        classesRemaining: top.classesRemaining,
        expiresAt: new Date(top.expiresAt),
        isUnlimited: top.classesRemaining === null,
    };
}
