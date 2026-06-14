// FRONTEND-ONLY mock package offers. Mirrors planned `PackageOffer` shape.

export type PackageType =
    | "CLASSES_5"
    | "CLASSES_10"
    | "CLASSES_20"
    | "UNLIMITED"
    | "WALK_IN";

export interface PackageOffer {
    id: string;
    name: string;
    type: PackageType;
    priceTHB: number;
    /** Number of classes; null for UNLIMITED + WALK_IN handled separately. */
    classCount: number | null;
    validityDays: number;
    tagline: string;
    perks: string[];
    highlight?: boolean;
    sortOrder: number;
}

export const PACKAGE_OFFERS: PackageOffer[] = [
    {
        id: "pkg_walkin",
        name: "Walk-in",
        type: "WALK_IN",
        priceTHB: 500,
        classCount: 1,
        validityDays: 7,
        tagline: "One class, no commitment.",
        perks: ["1 class", "Valid 7 days", "Any class style"],
        sortOrder: 1,
    },
    {
        id: "pkg_5",
        name: "5-Class Pack",
        type: "CLASSES_5",
        priceTHB: 2250,
        classCount: 5,
        validityDays: 30,
        tagline: "Perfect for a short series.",
        perks: ["5 classes", "Valid 30 days", "Save ฿250 vs walk-in"],
        sortOrder: 2,
    },
    {
        id: "pkg_10",
        name: "10-Class Pack",
        type: "CLASSES_10",
        priceTHB: 4000,
        classCount: 10,
        validityDays: 60,
        tagline: "Build a steady weekly practice.",
        perks: ["10 classes", "Valid 60 days", "Save ฿1,000 vs walk-in"],
        highlight: true,
        sortOrder: 3,
    },
    {
        id: "pkg_20",
        name: "20-Class Pack",
        type: "CLASSES_20",
        priceTHB: 7000,
        classCount: 20,
        validityDays: 120,
        tagline: "For the regulars.",
        perks: ["20 classes", "Valid 120 days", "Save ฿3,000 vs walk-in"],
        sortOrder: 4,
    },
];

export function getPackageOffer(id: string): PackageOffer | null {
    return PACKAGE_OFFERS.find((p) => p.id === id) ?? null;
}

export function formatTHB(value: number): string {
    return "฿" + value.toLocaleString("en-US");
}
