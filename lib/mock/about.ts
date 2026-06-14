// FRONTEND-ONLY mock for About Us page (staff + contact form topics).
// Replaced in the backend pass by Prisma queries against `StaffMember` table.

export interface StaffMember {
    id: string;
    name: string;
    role: string;
    phone: string;
    initials: string;
}

export const STAFF: StaffMember[] = [
    {
        id: "staff_nus",
        name: "Nus",
        role: "Studio Manager",
        phone: "089-640-2121",
        initials: "N",
    },
    {
        id: "staff_bo",
        name: "Bo",
        role: "Front Desk & Bookings",
        phone: "095-686-6966",
        initials: "B",
    },
];

export const MESSAGE_TOPICS = [
    "Class booking",
    "Package purchase",
    "Private class inquiry",
    "Feedback",
    "Other",
] as const;

export type MessageTopic = (typeof MESSAGE_TOPICS)[number];
