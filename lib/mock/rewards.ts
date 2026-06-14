// FRONTEND-ONLY mock for the Tiger Toys collection + milestones.
// Replaced in the backend pass by `ToyPart`, `MemberToyPart`, `Milestone`,
// `MemberMilestone` Prisma tables.

export interface ToyPart {
  code: string;
  name: string;
  /** Threshold of classes attended at which this part is earned. */
  earnAt: number;
  /** Lucide icon name (rendered by the component layer). */
  icon: ToyPartIcon;
  sortOrder: number;
}

export type ToyPartIcon =
  | "tiger-head"
  | "heart"
  | "paw"
  | "leaf"
  | "flame"
  | "moon"
  | "sun"
  | "star";

// 8 parts — one earned per class for the first 8 classes, then mastery.
export const TOY_PARTS: ToyPart[] = [
  { code: "head", name: "Tiger Head", earnAt: 1, icon: "tiger-head", sortOrder: 1 },
  { code: "heart", name: "Brave Heart", earnAt: 2, icon: "heart", sortOrder: 2 },
  { code: "paw_fl", name: "Front-Left Paw", earnAt: 3, icon: "paw", sortOrder: 3 },
  { code: "paw_fr", name: "Front-Right Paw", earnAt: 4, icon: "paw", sortOrder: 4 },
  { code: "leaf", name: "Forest Leaf", earnAt: 5, icon: "leaf", sortOrder: 5 },
  { code: "flame", name: "Inner Flame", earnAt: 6, icon: "flame", sortOrder: 6 },
  { code: "moon", name: "Quiet Moon", earnAt: 7, icon: "moon", sortOrder: 7 },
  { code: "sun", name: "Steady Sun", earnAt: 8, icon: "sun", sortOrder: 8 },
];

export interface Milestone {
  code: string;
  name: string;
  description: string;
  /** Required number of classes attended to unlock. */
  classesRequired: number;
  /** Reward copy shown on the milestone card. */
  rewardLabel: string;
  /** Optional CTA destination when the user taps "View reward". */
  ctaHref: string;
  ctaLabel: string;
}

export const MILESTONES: Milestone[] = [
  {
    code: "first_step",
    name: "First Step",
    description: "You showed up. The hardest part is over.",
    classesRequired: 1,
    rewardLabel: "Welcome tea on the house",
    ctaHref: "/contact",
    ctaLabel: "Claim at the studio",
  },
  {
    code: "steady",
    name: "Steady Practice",
    description: "Five classes in. You're building a rhythm.",
    classesRequired: 5,
    rewardLabel: "10% off your next pack",
    ctaHref: "/promotion",
    ctaLabel: "Browse packs",
  },
  {
    code: "tiger",
    name: "Tiger Pack",
    description: "Twenty classes. You earned your stripes.",
    classesRequired: 20,
    rewardLabel: "Free Yin & Sound class",
    ctaHref: "/book",
    ctaLabel: "Pick a class",
  },
  {
    code: "leopard",
    name: "Leopard Path",
    description: "Fifty classes — your practice radiates.",
    classesRequired: 50,
    rewardLabel: "MiTR-branded mat strap",
    ctaHref: "/contact",
    ctaLabel: "Claim at the studio",
  },
  {
    code: "century",
    name: "100 Club",
    description: "One hundred classes. You are MiTR.",
    classesRequired: 100,
    rewardLabel: "Custom Tiger Toys figurine",
    ctaHref: "/contact",
    ctaLabel: "Claim at the studio",
  },
];
