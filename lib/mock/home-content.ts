// FRONTEND-ONLY mock for the seasonal home hero / banner.
// Replaced in the backend pass by the `HomeContent` Prisma singleton + admin route.

export interface HomeContent {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    banner: {
        eyebrow: string;
        title: string;
        body: string;
        href: string;
        cta: string;
    };
    contact: {
        phone: string;
        /** Pre-formatted address line for display. */
        address: string;
        /** Free-form query passed to Google Maps. */
        mapQuery: string;
        /** LINE OA basic ID (with @). */
        lineBasicId: string;
    };
    quoteOfWeek: {
        text: string;
        author?: string;
    };
    poseOfWeek: {
        name: string;
        description: string;
        /** Optional image URL; if absent, a fallback icon is shown. */
        imageUrl?: string;
    };
}

export const HOME_CONTENT: HomeContent = {
    heroEyebrow: "MiTR Journey",
    heroTitle: "Yoga Studio",
    heroSubtitle: "Slow practice. Steady mind. Strong body.",
    heroTagline: "Discover the strength and soul within your everyday journey.",
    banner: {
        eyebrow: "Seasonal · June 2026",
        title: "Monsoon Reset",
        body: "20% off the 10-class pack through end of June.",
        href: "/promotion",
        cta: "See packages",
    },
    contact: {
        phone: "095-686-6966",
        address:
            "MiTR Journey Studio · ซอยเสือใหญ่อุทิศ (ถนน รัชดาภิเษก36), Bangkok",
        mapQuery: "Mitr Journey Yoga Studio ซอยเสือใหญ่อุทิศ",
        lineBasicId: "@mitrjourney",
    },
    quoteOfWeek: {
        text: "Yoga is not about touching your toes. It is about what you learn on the way down.",
        author: "Jigar Gor",
    },
    poseOfWeek: {
        name: "Warrior II",
        description:
            "A grounding standing pose that builds strength in the legs and opens the hips and chest. Hold for 5 slow breaths on each side.",
    },
};
