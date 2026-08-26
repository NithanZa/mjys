import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  classes: "classes",
  instructors: "instructors",
  packageOffers: "package-offers",
  homeBanners: "home-banners",
  memberStats: "admin-member-stats",
  staffStats: "admin-staff-stats",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export function expireCacheTag(tag: CacheTag) {
  revalidateTag(tag, { expire: 0 });
}

export function expireCacheTags(...tags: CacheTag[]) {
  tags.forEach(expireCacheTag);
}
