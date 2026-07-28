// Client-side data access for real (Prisma-backed) instructors.
// Replaces `lib/mock/schedule.ts`'s hardcoded `INSTRUCTORS` array.

export interface Instructor {
    id: string;
    slug: string;
    name: string;
    title: string;
    bio: string;
    photoUrl: string | null;
    initials: string;
    order: number;
}

export async function fetchInstructors(): Promise<Instructor[]> {
    const res = await fetch("/api/instructors");
    if (!res.ok) {
        throw new Error("Failed to fetch instructors");
    }
    const data = await res.json();
    return data.instructors as Instructor[];
}
