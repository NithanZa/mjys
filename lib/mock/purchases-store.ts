"use client";

import { useLiff } from "@/lib/liff";
import { getPackageOffer, type PackageOffer } from "@/lib/mock/packages";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { addDays } from "date-fns";

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
    /** Public URL of the uploaded bank-transfer slip, if any. */
    proofImageUrl: string | null;
    rejectionReason?: string | null;
}

export interface ActivePackageView {
    purchase: MockPurchase;
    offer: PackageOffer;
    classesRemaining: number | null;
    expiresAt: Date;
    isUnlimited: boolean;
}

// ---- snapshot caching for local storage fallback ----
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

export interface UsePurchasesResult {
    purchases: MockPurchase[];
    pendingPurchases: MockPurchase[];
    activePackage: ActivePackageView | null;
    loading: boolean;
    /** Upload a bank-transfer slip image. Returns its public URL (or a data URL in mock mode). */
    uploadSlip: (file: File) => Promise<string>;
    /** Create a new PENDING purchase for the given offer. Returns the new purchase id. */
    createPending: (offerId: string, proofImageUrl?: string) => Promise<string>;
    /** Simulate studio approval of a PENDING purchase (frontend stub for AC5). */
    approvePending: (purchaseId: string) => Promise<void>;
    /** Reject a PENDING purchase. */
    rejectPending: (purchaseId: string) => Promise<void>;
    /** Reset all purchases (dev). */
    reset: () => Promise<void>;
}

export function usePurchases(): UsePurchasesResult {
    const { liff, status, isLoggedIn } = useLiff();
    const [realPurchases, setRealPurchases] = useState<MockPurchase[]>([]);
    const [loading, setLoading] = useState(true);

    const isMock = status !== "ready" || !isLoggedIn || !liff;

    const mockPurchases = useSyncExternalStore(
        subscribe,
        readSnapshot,
        getServerSnapshot,
    );

    const fetchRealPurchases = useCallback(async () => {
        if (isMock) {
            setLoading(false);
            return;
        }

        try {
            const token = liff.getIDToken();
            if (!token) return;

            const res = await fetch("/api/purchases", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                
                // Map PendingPurchase table records
                const pendingMapped: MockPurchase[] = data.pendingPurchases.map((p: any) => ({
                    id: p.id,
                    offerId: p.packageOfferId,
                    status: p.status, // "PENDING" or "REJECTED" or "APPROVED"
                    classesRemaining: null,
                    expiresAt: null,
                    createdAt: p.createdAt,
                    reviewedAt: p.reviewedAt,
                    proofImageUrl: p.proofImageUrl ?? null,
                    rejectionReason: p.rejectionReason ?? null,
                }));

                // Map active Package table records
                const packagesMapped: MockPurchase[] = data.activePackages.map((p: any) => ({
                    id: p.id,
                    offerId: p.packageOfferId,
                    status: p.status === "ACTIVE" ? "APPROVED" : p.status, // ACTIVE maps to APPROVED in mock terminology
                    classesRemaining: p.classesRemaining,
                    expiresAt: p.expiresAt,
                    createdAt: p.createdAt,
                    reviewedAt: p.updatedAt,
                    proofImageUrl: null,
                }));

                // Merge and filter out duplicates (packages that were derived from pending)
                const combined = [...packagesMapped];
                pendingMapped.forEach((pending) => {
                    const existsInPackages = packagesMapped.some((pkg) => pkg.offerId === pending.offerId && pending.status === "APPROVED");
                    if (!existsInPackages) {
                        combined.push(pending);
                    }
                });

                setRealPurchases(combined);
            }
        } catch (err) {
            console.error("Failed to fetch real purchases:", err);
        } finally {
            setLoading(false);
        }
    }, [isMock, liff]);

    useEffect(() => {
        fetchRealPurchases();
    }, [fetchRealPurchases]);

    const activePurchases = isMock ? mockPurchases : realPurchases;
    const pendingPurchases = activePurchases.filter((p) => p.status === "PENDING");
    const activePackage = pickActivePackage(activePurchases);

    const uploadSlip = useCallback(
        async (file: File): Promise<string> => {
            if (isMock) {
                // Mock mode: embed the image as a data URL so the preview persists locally.
                return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error("Failed to read file"));
                    reader.readAsDataURL(file);
                });
            }

            const token = liff.getIDToken();
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to upload slip");
            }
            const data = await res.json();
            return data.url as string;
        },
        [isMock, liff],
    );

    const createPending = useCallback(
        async (offerId: string, proofImageUrl?: string): Promise<string> => {
            if (isMock) {
                const offer = getPackageOffer(offerId);
                if (!offer) throw new Error(`Unknown package offer: ${offerId}`);
                const purchase: MockPurchase = {
                    id: "pur_" + Math.random().toString(36).slice(2, 10),
                    offerId,
                    status: "PENDING",
                    classesRemaining: null,
                    expiresAt: null,
                    createdAt: new Date().toISOString(),
                    reviewedAt: null,
                    proofImageUrl: proofImageUrl ?? null,
                };
                writeSnapshot([...readSnapshot(), purchase]);
                return purchase.id;
            }

            setLoading(true);
            try {
                const token = liff.getIDToken();
                const res = await fetch("/api/purchases", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ packageOfferId: offerId, proofImageUrl }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to make purchase");
                }

                const data = await res.json();
                await fetchRealPurchases();
                return data.pendingPurchase.id;
            } catch (err: any) {
                alert(err.message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isMock, liff, fetchRealPurchases],
    );

    const approvePending = useCallback(
        async (purchaseId: string) => {
            if (isMock) {
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
                    classesRemaining: offer.classCount,
                    expiresAt,
                    reviewedAt: now.toISOString(),
                    proofImageUrl: target.proofImageUrl ?? null,
                };
                writeSnapshot(list.map((p) => (p.id === purchaseId ? updated : p)));
                return;
            }

            setLoading(true);
            try {
                const token = liff.getIDToken();
                const res = await fetch("/api/purchases", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ purchaseId, status: "APPROVED" }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to approve purchase");
                }

                await fetchRealPurchases();
            } catch (err: any) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        },
        [isMock, liff, fetchRealPurchases],
    );

    const rejectPending = useCallback(
        async (purchaseId: string) => {
            if (isMock) {
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
                return;
            }

            setLoading(true);
            try {
                const token = liff.getIDToken();
                const res = await fetch("/api/purchases", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ purchaseId, status: "REJECTED" }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to reject purchase");
                }

                await fetchRealPurchases();
            } catch (err: any) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        },
        [isMock, liff, fetchRealPurchases],
    );

    const reset = useCallback(async () => {
        if (isMock) {
            writeSnapshot([]);
            return;
        }

        setLoading(true);
        try {
            const token = liff.getIDToken();
            await fetch("/api/purchases", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchRealPurchases();
        } catch (err) {
            console.error("Failed to reset purchases:", err);
        } finally {
            setLoading(false);
        }
    }, [isMock, liff, fetchRealPurchases]);

    return {
        purchases: activePurchases,
        pendingPurchases,
        activePackage,
        loading,
        uploadSlip,
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
