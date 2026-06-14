// FRONTEND-ONLY mock schedule data. Deterministic so the UI is testable.
// Replaced in the backend pass by Prisma queries against `Instructor`,
// `ClassTemplate`, `ClassOccurrence` (see Phase 3 plan).

import { addDays, addHours, setHours, setMinutes, setSeconds } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { STUDIO_TZ, studioToday } from "@/lib/dates";

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

export interface ClassTemplate {
    id: string;
    name: string;
    description: string;
    durationMin: number;
    intensity: "Gentle" | "Balanced" | "Strong";
    tagline: string;
    isSpecial?: boolean;
}

export interface ClassOccurrence {
    id: string;
    templateId: string;
    instructorId: string;
    startsAt: Date;
    durationMin: number;
    capacity: number;
    bookedCount: number;
}

export interface OccurrenceView extends ClassOccurrence {
    template: ClassTemplate;
    instructor: Instructor;
    slotsLeft: number;
}

// ---- Static ------------------------------------------------------------------

export const INSTRUCTORS: Instructor[] = [
    {
        id: "ins_nop",
        slug: "kru-nop",
        name: "Kru Nop",
        title: "Founder · Lead Instructor",
        bio: "Kru Nop opened MiTR Journey to share a slow, breath-led practice rooted in Thai compassion. With 12 years of teaching across Bangkok and Chiang Mai, her classes feel less like exercise and more like coming home.",
        photoUrl: null,
        initials: "KN",
        order: 1,
    },
    {
        id: "ins_shubham",
        slug: "master-shubham",
        name: "Master Shubham",
        title: "Vinyasa · Pranayama",
        bio: "Trained in Rishikesh, Master Shubham brings precise alignment and a playful sense of flow. Expect intelligent sequencing, long holds, and a strong focus on the breath.",
        photoUrl: null,
        initials: "MS",
        order: 2,
    },
    {
        id: "ins_anup",
        slug: "master-anup",
        name: "Master Anup",
        title: "Ashtanga · Mobility",
        bio: "A traditional Ashtanga teacher with a modern mobility lens. Master Anup's classes build heat, then strength, then stillness — in that order.",
        photoUrl: null,
        initials: "MA",
        order: 3,
    },
    {
        id: "ins_x",
        slug: "kru-x",
        name: "Kru X",
        title: "Inversions · Arm Balances",
        bio: "Kru X is known for breaking down complex inversions into simple, repeatable progressions.",
        photoUrl: null,
        initials: "KX",
        order: 4,
    },
];

export const CLASS_TEMPLATES: ClassTemplate[] = [
    {
        id: "tpl_breath",
        name: "Breath & Restore",
        description:
            "A slow, restorative practice combining gentle shapes with long pranayama. Perfect after a long day or as a Sunday reset.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Breathe out the week.",
    },
    {
        id: "tpl_vinyasa",
        name: "Vinyasa Flow",
        description:
            "A breath-paced flow that builds heat, strength, and a quiet mind. Suitable for steady beginners and confident regulars.",
        durationMin: 75,
        intensity: "Balanced",
        tagline: "Move with the breath.",
    },
    {
        id: "tpl_strong",
        name: "Strong Practice",
        description:
            "Energetic Ashtanga-inspired practice. Sun salutations, standing series, and inversions for those ready to sweat.",
        durationMin: 75,
        intensity: "Strong",
        tagline: "Earn your stillness.",
    },
    {
        id: "tpl_yin",
        name: "Yin & Sound",
        description:
            "Long, supported holds paired with a closing sound bath. A deep release for fascia and nervous system both.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Settle, soften, surrender.",
    },
    {
        id: "tpl_handstand_mc",
        name: "Handstand MC",
        description:
            "A specialized workshop targeting the core, shoulders, and wrist prep required for solid handstands.",
        durationMin: 90,
        intensity: "Strong",
        tagline: "Turn your world upside down.",
        isSpecial: true,
    },
    {
        id: "tpl_scorpion_mc",
        name: "Scorpion MC",
        description:
            "Learn to transition seamlessly from forearm stand to scorpion with safety and control.",
        durationMin: 90,
        intensity: "Strong",
        tagline: "Deepen your backbend.",
        isSpecial: true,
    },
];

// ---- Occurrences (deterministic generator) -----------------------------------

interface Slot {
    hour: number;
    minute: number;
    templateId: string;
    instructorId: string;
    capacity: number;
    /** Pre-baked bookedCount so some classes feel busy and at least one is full. */
    pre: number;
}

// Two slots per day, M-F. One slot Sat. Sun closed.
const WEEKDAY_SLOTS: Slot[] = [
    {
        hour: 9,
        minute: 0,
        templateId: "tpl_breath",
        instructorId: "ins_nop",
        capacity: 12,
        pre: 4,
    },
    {
        hour: 18,
        minute: 30,
        templateId: "tpl_vinyasa",
        instructorId: "ins_shubham",
        capacity: 14,
        pre: 9,
    },
];

const WEEKEND_SLOTS: Slot[] = [
    {
        hour: 8,
        minute: 0,
        templateId: "tpl_strong",
        instructorId: "ins_anup",
        capacity: 12,
        pre: 12, // one full class so AC6 ("Full") is testable
    },
    {
        hour: 17,
        minute: 0,
        templateId: "tpl_yin",
        instructorId: "ins_nop",
        capacity: 16,
        pre: 7,
    },
];

const SCHEDULE_DAYS = 30;

function buildOccurrencesForDay(date: Date): ClassOccurrence[] {
    // Use studio-local weekday so days line up with the user's calendar.
    const local = toZonedTime(date, STUDIO_TZ);
    const dow = local.getDay(); // 0 Sun, 6 Sat
    const mday = local.getDate();

    if (dow === 0) {
        // Sunday Special Masterclass!
        const templateId = mday % 2 === 0 ? "tpl_handstand_mc" : "tpl_scorpion_mc";
        const preBooked = mday % 2 === 0 ? 12 : 10;
        
        const localStart = setSeconds(
            setMinutes(setHours(local, 9), 0),
            0,
        );
        const startsAt = fromZonedTime(localStart, STUDIO_TZ);
        return [
            {
                id: `occ_${date.toISOString().slice(0, 10)}_0`,
                templateId,
                instructorId: "ins_x",
                startsAt,
                durationMin: 90,
                capacity: 15,
                bookedCount: preBooked,
            }
        ];
    }

    const slots: Slot[] = dow === 6 ? WEEKEND_SLOTS : WEEKDAY_SLOTS;

    return slots.map((slot, i) => {
        const localStart = setSeconds(
            setMinutes(setHours(local, slot.hour), slot.minute),
            0,
        );
        const startsAt = fromZonedTime(localStart, STUDIO_TZ);
        const template = CLASS_TEMPLATES.find((t) => t.id === slot.templateId);
        const durationMin = template ? template.durationMin : 60;
        return {
            id: `occ_${date.toISOString().slice(0, 10)}_${i}`,
            templateId: slot.templateId,
            instructorId: slot.instructorId,
            startsAt,
            durationMin,
            capacity: slot.capacity,
            bookedCount: slot.pre,
        };
    });
}

let occurrenceCache: ClassOccurrence[] | null = null;

function ensureOccurrences(): ClassOccurrence[] {
    if (occurrenceCache) return occurrenceCache;
    const today = studioToday();
    const out: ClassOccurrence[] = [];
    for (let i = 0; i < SCHEDULE_DAYS; i++) {
        out.push(...buildOccurrencesForDay(addDays(today, i)));
    }
    occurrenceCache = out;
    return out;
}

// ---- Public API --------------------------------------------------------------

export function getInstructor(slugOrId: string): Instructor | null {
    return (
        INSTRUCTORS.find((i) => i.slug === slugOrId || i.id === slugOrId) ??
        null
    );
}

export function getTemplate(id: string): ClassTemplate | null {
    return CLASS_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function getOccurrence(id: string): OccurrenceView | null {
    const occ = ensureOccurrences().find((o) => o.id === id);
    if (!occ) return null;
    return toView(occ);
}

export function getOccurrencesForDay(date: Date): OccurrenceView[] {
    const start = date.getTime();
    const end = addHours(date, 24).getTime();
    return ensureOccurrences()
        .filter(
            (o) => o.startsAt.getTime() >= start && o.startsAt.getTime() < end,
        )
        .map(toView)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function toView(occ: ClassOccurrence): OccurrenceView {
    const template = getTemplate(occ.templateId)!;
    const instructor = INSTRUCTORS.find((i) => i.id === occ.instructorId)!;
    return {
        ...occ,
        template,
        instructor,
        slotsLeft: Math.max(0, occ.capacity - occ.bookedCount),
    };
}

export function getScheduleRange(): { from: Date; to: Date } {
    const from = studioToday();
    return { from, to: addDays(from, SCHEDULE_DAYS - 1) };
}

export function getAllOccurrences(): OccurrenceView[] {
    return ensureOccurrences()
        .map(toView)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
