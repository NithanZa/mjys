"use client";

import { useLiff } from "@/lib/liff";
import type { PackageOffer } from "@/lib/api/packages";
import { useCallback, useEffect, useMemo, useState } from "react";

export type PurchaseStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "EXHAUSTED";

export interface Purchase {
  id: string;
  offerId: string | null;
  offer: PackageOffer | null;
  kind: "PACKAGE" | "SPECIAL_CLASS";
  status: PurchaseStatus;
  classesRemaining: number | null;
  expiresAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
  proofImageUrl: string | null;
  rejectionReason: string | null;
  amountTHB: number;
  className: string | null;
}

export interface NextExpiryView {
  classesRemaining: number;
  expiresAt: Date;
}

export interface UsePurchasesResult {
  purchases: Purchase[];
  pendingPurchases: Purchase[];
  remainingClasses: number;
  nextExpiry: NextExpiryView | null;
  loading: boolean;
  error: string | null;
  uploadSlip: (file: File) => Promise<string>;
  createPending: (offerId: string, proofImageUrl?: string) => Promise<string>;
  refresh: () => Promise<void>;
}

interface PackageWire {
  id: string;
  packageOfferId: string;
  offer: PackageOffer;
  status: "ACTIVE" | "EXPIRED" | "EXHAUSTED";
  classesRemaining: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PendingPurchaseWire {
  id: string;
  packageOfferId: string | null;
  offer: PackageOffer | null;
  kind: "PACKAGE" | "SPECIAL_CLASS";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  proofImageUrl: string | null;
  rejectionReason: string | null;
  amountTHB: number;
  classOccurrence: { name: string } | null;
}

interface PurchasesWire {
  packages: PackageWire[];
  pendingPurchases: PendingPurchaseWire[];
  remainingClasses: number;
  nextExpiry: { classesRemaining: number; expiresAt: string } | null;
}

const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";

export function usePurchases(): UsePurchasesResult {
  const { liff, status, isLoggedIn } = useLiff();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [remainingClasses, setRemainingClasses] = useState(0);
  const [nextExpiry, setNextExpiry] = useState<NextExpiryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    if (isStandalone) return {};
    const token = liff?.getIDToken();
    if (!token) throw new Error("No LINE ID token available");
    return { Authorization: `Bearer ${token}` };
  }, [liff]);

  const refresh = useCallback(async () => {
    if (!isStandalone && (status !== "ready" || !isLoggedIn || !liff)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/purchases", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch purchases");
      const data = (await res.json()) as PurchasesWire;
      const packagePurchases: Purchase[] = data.packages.map((pkg) => ({
        id: pkg.id,
        offerId: pkg.packageOfferId,
        offer: pkg.offer as PackageOffer,
        kind: "PACKAGE" as const,
        status: pkg.status === "ACTIVE" ? "APPROVED" : pkg.status,
        classesRemaining: pkg.classesRemaining,
        expiresAt: pkg.expiresAt,
        createdAt: pkg.createdAt,
        reviewedAt: pkg.updatedAt,
        proofImageUrl: null,
        rejectionReason: null,
        amountTHB: pkg.offer.discountPriceTHB ?? pkg.offer.priceTHB,
        className: null,
      }));
      const pendingPurchases: Purchase[] = data.pendingPurchases
        .filter((purchase) => purchase.kind === "SPECIAL_CLASS" || purchase.status !== "APPROVED")
        .map((purchase) => ({
          id: purchase.id,
          offerId: purchase.packageOfferId ?? null,
          offer: purchase.offer as PackageOffer | null,
          kind: purchase.kind as "PACKAGE" | "SPECIAL_CLASS",
          status: purchase.status as PurchaseStatus,
          classesRemaining: null,
          expiresAt: null,
          createdAt: purchase.createdAt,
          reviewedAt: purchase.reviewedAt,
          proofImageUrl: purchase.proofImageUrl ?? null,
          rejectionReason: purchase.rejectionReason ?? null,
          amountTHB: purchase.amountTHB,
          className: purchase.classOccurrence?.name ?? null,
        }));
      const nextPurchases = [...packagePurchases, ...pendingPurchases];
      setPurchases(nextPurchases);
      setRemainingClasses(data.remainingClasses ?? 0);
      setNextExpiry(
        data.nextExpiry
          ? {
              classesRemaining: data.nextExpiry.classesRemaining,
              expiresAt: new Date(data.nextExpiry.expiresAt),
            }
          : null,
      );
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch purchases";
      setError(message);
      setPurchases([]);
      setRemainingClasses(0);
      setNextExpiry(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, isLoggedIn, liff, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadSlip = useCallback(async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to upload slip");
    }
    const data = await res.json();
    return data.path as string;
  }, [authHeaders]);

  const createPending = useCallback(async (offerId: string, proofImageUrl?: string): Promise<string> => {
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ packageOfferId: offerId, proofImageUrl }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to create purchase");
    }
    const data = await res.json();
    await refresh();
    return data.pendingPurchase.id as string;
  }, [authHeaders, refresh]);

  const pendingPurchases = useMemo(
    () => purchases.filter((purchase) => purchase.status === "PENDING"),
    [purchases],
  );

  return {
    purchases,
    pendingPurchases,
    remainingClasses,
    nextExpiry,
    loading,
    error,
    uploadSlip,
    createPending,
    refresh,
  };
}
