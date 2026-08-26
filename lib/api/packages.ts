export interface PackageOffer {
  id: string;
  name: string;
  type: "CLASSES_5" | "CLASSES_10" | "CLASSES_20" | "WALK_IN";
  priceTHB: number;
  discountPriceTHB: number | null;
  classCount: number;
  validityDays: number;
  tagline: string;
  perks: string[];
  highlight: boolean;
  sortOrder: number;
  active: boolean;
}

export function formatTHB(amount: number): string {
  return `฿${amount.toLocaleString("en-US")}`;
}

export async function fetchPackageOffers(): Promise<PackageOffer[]> {
  const res = await fetch("/api/packages");
  if (!res.ok) throw new Error("Failed to fetch package offers");
  const data = await res.json();
  return data.offers as PackageOffer[];
}

export async function fetchPackageOffer(offerId: string): Promise<PackageOffer | null> {
  const offers = await fetchPackageOffers();
  return offers.find((offer) => offer.id === offerId) ?? null;
}
