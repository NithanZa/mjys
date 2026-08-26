import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
    classes: "classes",
    instructors: "instructors",
    packageOffers: "package-offers",
    homeBanners: "home-banners",
} as const;

/** Route handlers need blocking expiry so the next public read sees admin writes. */
export function expireCacheTag(tag: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]) {
    revalidateTag(tag, { expire: 0 });
}

