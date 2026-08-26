import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache/tags";

const THREE_MINUTES = 3 * 60;

export const getCachedPackageOffers = unstable_cache(
    async () =>
        prisma.packageOffer.findMany({
            where: { active: true },
            orderBy: { sortOrder: "asc" },
        }),
    ["package-offers"],
    { revalidate: THREE_MINUTES, tags: [CACHE_TAGS.packageOffers] },
);

export const getCachedHomeBanners = unstable_cache(
    async () =>
        prisma.homeBanner.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                title: true,
                eyebrow: true,
                imageUrl: true,
                href: true,
                sortOrder: true,
            },
        }),
    ["home-banners"],
    { revalidate: THREE_MINUTES, tags: [CACHE_TAGS.homeBanners] },
);

