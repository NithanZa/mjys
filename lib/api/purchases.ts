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

export interface ActivePackageView {
  purchase: Purchase;
  offer: PackageOffer;
  classesRemaining: number | null;
  expiresAt: Date;
  isUnlimited: boolean;
}

export interface UsePurchasesResult {
  purchases: Purchase[];
  pendingPurchases: Purchase[];
  activePackage: ActivePackageView | null;
  loading: boolean;
  error: string | null;
  uploadSlip: (file: File) => Promise<string>;
  createPending: (offerId: string, proofImageUrl?: string) => Promise<string>;
  refresh: () => Promise<void>;
}

const isStandalone = process.env.NEXT_PUBLIC_STANDALONE_MODE === "true";

export function usePurchases(): UsePurchasesResult {
  const { liff, status, isLoggedIn } = useLiff();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activePackage, setActivePackage] = useState<ActivePackageView | null>(null);
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
      const data = await res.json();
      const packagePurchases = (data.activePackages as Array<any>).map((pkg) => ({
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
      const pendingPurchases = (data.pendingPurchases as Array<any>)
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
      const active = packagePurchases
        .filter((purchase) => purchase.status === "APPROVED" && purchase.offer && purchase.expiresAt)
        .filter((purchase) => purchase.classesRemaining !== 0)
        .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0];
      setActivePackage(
        active && active.offer && active.expiresAt
          ? {
              purchase: active,
              offer: active.offer,
              classesRemaining: active.classesRemaining,
              expiresAt: new Date(active.expiresAt),
              isUnlimited: active.classesRemaining === null,
            }
          : null,
      );
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch purchases";
      setError(message);
      setPurchases([]);
      setActivePackage(null);
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

  return { purchases, pendingPurchases, activePackage, loading, error, uploadSlip, createPending, refresh };
}
