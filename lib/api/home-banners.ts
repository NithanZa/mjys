export interface HomeBannerDTO {
    id: string;
    title: string;
    eyebrow: string | null;
    imageUrl: string;
    href: string;
    sortOrder: number;
}

/**
 * Fetches active home banners from the public API.
 * Returns an empty array on failure so the home page degrades gracefully.
 */
export async function getHomeBanners(): Promise<HomeBannerDTO[]> {
    try {
        const res = await fetch("/api/home-banners", { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return data.banners ?? [];
    } catch {
        return [];
    }
}
