"use client";

import { TopBar } from "@/components/layout";
import {
  ActivePackageStrip,
  PackageCard,
  TransactionHistory,
} from "@/components/promotion";
import { fetchPackageOffers, type PackageOffer } from "@/lib/api/packages";
import { usePurchases } from "@/lib/api/purchases";
import { useState, useEffect } from "react";

export default function PromotionPage() {
  const { activePackage, pendingPurchases, purchases } = usePurchases();
  const [offers, setOffers] = useState<PackageOffer[]>([]);

  useEffect(() => {
    fetchPackageOffers()
      .then(setOffers)
      .catch((err) => console.error("Failed to fetch package offers:", err));
  }, []);

  return (
    <>
      <TopBar title="Packages" />

      <div className="flex flex-col gap-4">
        <ActivePackageStrip active={activePackage} />

        {pendingPurchases.length > 0 && (
          <div className="rounded-md border border-warning-fg/30 bg-warning-bg px-3 py-2 font-sans text-body-sm text-warning-fg">
            {pendingPurchases.length === 1
              ? "1 purchase awaiting studio approval."
              : `${pendingPurchases.length} purchases awaiting studio approval.`}
          </div>
        )}

        <div>
          <h2 className="font-display text-h2 font-medium text-neutral-ink">
            Choose your pack
          </h2>
          <p className="mt-1 font-sans text-body text-neutral-text-2">
            Pay once, practice on your own pace.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <PackageCard key={offer.id} offer={offer} />
          ))}
        </div>

        <TransactionHistory purchases={purchases} />
      </div>
    </>
  );
}
