// FRONTEND-ONLY mock schedule data. Deterministic so the UI is testable.
// Replaced in the backend pass by Prisma queries against `Instructor`
// and `ClassOccurrence` (see Phase 3 plan).

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

export interface ClassOccurrence {
    id: string;
    instructorId: string;
    startsAt: Date;
    durationMin: number;
    capacity: number;
    bookedCount: number;
    name: string;
    description: string;
    tagline: string;
    intensity: "Gentle" | "Balanced" | "Strong";
    isSpecial: boolean;
}

export interface OccurrenceView extends ClassOccurrence {
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
        id: "ins_krish",
        slug: "master-krish",
        name: "Master Krish",
        title: "Stretching · Hatha Flow",
        bio: "Master Krish integrates traditional Hatha alignments with therapeutic stretches to help students build flexible, balanced, and injury-free bodies.",
        photoUrl: null,
        initials: "MK",
        order: 3,
    },
    {
        id: "ins_ex",
        slug: "kru-ex",
        name: "Kru EX",
        title: "Inversions · Workshops",
        bio: "Kru EX specializes in advanced inversions, arm balances, and specialized workshops, making complex transitions simple and safe.",
        photoUrl: null,
        initials: "KE",
        order: 4,
    },
    {
        id: "ins_anup",
        slug: "master-anup",
        name: "Master Anup",
        title: "Ashtanga · Mobility",
        bio: "A traditional Ashtanga teacher with a modern mobility lens. Master Anup's classes build heat, then strength, then stillness — in that order.",
        photoUrl: null,
        initials: "MA",
        order: 5,
    },
    {
        id: "ins_x",
        slug: "kru-x",
        name: "Kru X",
        title: "Inversions · Arm Balances",
        bio: "Kru X is known for breaking down complex inversions into simple, repeatable progressions.",
        photoUrl: null,
        initials: "KX",
        order: 6,
    },
];

const CLASS_DATA: Record<string, { name: string; description: string; tagline: string; intensity: "Gentle" | "Balanced" | "Strong"; isSpecial: boolean; durationMin: number }> = {
    tpl_easy_flow: { name: "Easy Flow", description: "A gentle and slow-paced flow focused on foundational postures, alignment, and simple transitions. Perfect for beginners and those seeking a mindful, relaxing practice.", tagline: "Find your flow, ease your mind.", intensity: "Gentle", isSpecial: false, durationMin: 60 },
    tpl_morning_stretching: { name: "Morning Stretching", description: "Awaken your body with gentle stretches and movements that release tension built up during sleep. Great for flexibility and starting the day with energy.", tagline: "Awaken and energize.", intensity: "Gentle", isSpecial: false, durationMin: 60 },
    tpl_open_shoulder: { name: "Open Shoulder", description: "Targeted stretches and strengthening postures to open up the shoulders, neck, and upper back, relieving tension from desk work and poor posture.", tagline: "Release tension, open your heart.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_stretching: { name: "Stretching", description: "A full-body stretching session designed to improve overall flexibility, enhance range of motion, and promote deep relaxation of tight muscles.", tagline: "Lengthen and loosen.", intensity: "Gentle", isSpecial: false, durationMin: 60 },
    tpl_hatha_flow: { name: "Hatha Flow", description: "A classic practice integrating breath with holding postures to build strength, balance, and mental clarity. Conducted at a steady, deliberate pace.", tagline: "Balance strength and stillness.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_vinyasa: { name: "Vinyasa Flow", description: "A breath-paced flow that builds heat, strength, and a quiet mind. Suitable for steady beginners and confident regulars.", tagline: "Move with the breath.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_strong_core: { name: "Strong Core", description: "A dynamic yoga session emphasizing core strength, stability, and abdominal power. Prepare to sweat and build deep core heat.", tagline: "Build strength from within.", intensity: "Strong", isSpecial: false, durationMin: 60 },
    tpl_office_syndrome: { name: "Office Syndrome", description: "Specially designed for office workers to target common problem areas: neck, shoulders, back, and hips. Alleviate chronic pain and stiffness.", tagline: "Relieve tension from desk work.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_side_bend: { name: "Side Bend", description: "Focus on lateral stretches and spine elongation to expand lung capacity, open up the ribs, and improve side body flexibility.", tagline: "Stretch and expand your sides.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_flexibility: { name: "Flexibility", description: "Focuses on deep stretches and passive holds to improve flexibility, release deep tissue tightness, and increase joint mobility.", tagline: "Unlock your body's flexibility.", intensity: "Gentle", isSpecial: false, durationMin: 60 },
    tpl_backbending: { name: "Backbending", description: "Learn the anatomy and mechanics of safe backbends. Strengthen the spine, open the chest, and build flexibility in a controlled and safe environment.", tagline: "Open your front, strengthen your back.", intensity: "Strong", isSpecial: false, durationMin: 60 },
    tpl_hip_opening: { name: "Hip Opening", description: "A deep, nourishing practice focused entirely on opening the hips, releasing stored physical and emotional tension.", tagline: "Release tension in the hips.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_balance_flow: { name: "Balance Flow", description: "A flowing sequence emphasizing both physical and mental balance. Connect with your center through steady standing poses and transitions.", tagline: "Find your steady center.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
    tpl_inversion_special: { name: "* Special Class * Inversion", description: "A 3-hour comprehensive workshop breaking down headstands, forearm stands, and handstands with step-by-step progressions, safety, and alignment.", tagline: "Invert your practice with safety.", intensity: "Strong", isSpecial: true, durationMin: 180 },
    tpl_gentle_flow: { name: "Gentle Flow", description: "A soft, nurturing yoga practice featuring gentle movements and breathing exercises to calm the nervous system and build gentle strength.", tagline: "Be kind to your body.", intensity: "Gentle", isSpecial: false, durationMin: 60 },
    tpl_twist: { name: "Twist", description: "A detoxifying sequence of seated and standing twists designed to massage internal organs, improve digestion, and restore spinal mobility.", tagline: "Twist, detoxify, and restore.", intensity: "Balanced", isSpecial: false, durationMin: 60 },
};

// ---- Occurrences (deterministic generator) -----------------------------------

interface Slot {
    hour: number;
    minute: number;
    templateId: string;
    instructorId: string;
    capacity: number;
    pre: number;
    durationMin?: number;
}

const DAILY_SCHEDULE_MAP: { [mday: number]: Slot[] } = {
    // Week 1 (Monday June 1st to Sunday June 7th)
    1: [{ hour: 7, minute: 0, templateId: "tpl_easy_flow", instructorId: "ins_shubham", capacity: 15, pre: 5 }],
    2: [{ hour: 7, minute: 0, templateId: "tpl_morning_stretching", instructorId: "ins_nop", capacity: 15, pre: 4 }],
    3: [], // Wednesday Closed
    4: [{ hour: 7, minute: 0, templateId: "tpl_open_shoulder", instructorId: "ins_nop", capacity: 15, pre: 6 }],
    5: [
        { hour: 18, minute: 0, templateId: "tpl_stretching", instructorId: "ins_krish", capacity: 15, pre: 7 },
        { hour: 19, minute: 10, templateId: "tpl_hatha_flow", instructorId: "ins_krish", capacity: 15, pre: 5 }
    ],
    6: [
        { hour: 16, minute: 0, templateId: "tpl_vinyasa", instructorId: "ins_shubham", capacity: 15, pre: 8 },
        { hour: 17, minute: 10, templateId: "tpl_strong_core", instructorId: "ins_shubham", capacity: 15, pre: 6 }
    ],
    7: [], // Sunday Closed

    // Week 2 (Monday June 8th to Sunday June 14th)
    8: [{ hour: 7, minute: 0, templateId: "tpl_office_syndrome", instructorId: "ins_shubham", capacity: 15, pre: 9 }],
    9: [{ hour: 7, minute: 0, templateId: "tpl_side_bend", instructorId: "ins_nop", capacity: 15, pre: 5 }],
    10: [], // Wednesday Closed
    11: [{ hour: 7, minute: 0, templateId: "tpl_stretching", instructorId: "ins_nop", capacity: 15, pre: 4 }],
    12: [
        { hour: 18, minute: 0, templateId: "tpl_flexibility", instructorId: "ins_krish", capacity: 15, pre: 8 },
        { hour: 19, minute: 10, templateId: "tpl_backbending", instructorId: "ins_krish", capacity: 15, pre: 6 }
    ],
    13: [
        { hour: 16, minute: 0, templateId: "tpl_hip_opening", instructorId: "ins_shubham", capacity: 15, pre: 10 },
        { hour: 17, minute: 10, templateId: "tpl_balance_flow", instructorId: "ins_shubham", capacity: 15, pre: 7 }
    ],
    14: [], // Sunday Closed

    // Week 3 (Monday June 15th to Sunday June 21st)
    15: [{ hour: 7, minute: 0, templateId: "tpl_easy_flow", instructorId: "ins_shubham", capacity: 15, pre: 6 }],
    16: [{ hour: 7, minute: 0, templateId: "tpl_morning_stretching", instructorId: "ins_nop", capacity: 15, pre: 5 }],
    17: [], // Wednesday Closed
    18: [{ hour: 7, minute: 0, templateId: "tpl_open_shoulder", instructorId: "ins_nop", capacity: 15, pre: 8 }],
    19: [
        { hour: 18, minute: 0, templateId: "tpl_stretching", instructorId: "ins_krish", capacity: 15, pre: 12 },
        { hour: 19, minute: 10, templateId: "tpl_hatha_flow", instructorId: "ins_krish", capacity: 15, pre: 10 }
    ],
    20: [
        { hour: 16, minute: 0, templateId: "tpl_vinyasa", instructorId: "ins_shubham", capacity: 15, pre: 14 },
        { hour: 17, minute: 10, templateId: "tpl_strong_core", instructorId: "ins_shubham", capacity: 15, pre: 15 }
    ],
    21: [], // Sunday Closed

    // Week 4 (Monday June 22nd to Sunday June 28th)
    22: [{ hour: 7, minute: 0, templateId: "tpl_office_syndrome", instructorId: "ins_shubham", capacity: 15, pre: 9 }],
    23: [{ hour: 7, minute: 0, templateId: "tpl_side_bend", instructorId: "ins_nop", capacity: 15, pre: 6 }],
    24: [], // Wednesday Closed
    25: [{ hour: 7, minute: 0, templateId: "tpl_stretching", instructorId: "ins_nop", capacity: 15, pre: 7 }],
    26: [
        { hour: 18, minute: 0, templateId: "tpl_flexibility", instructorId: "ins_krish", capacity: 15, pre: 11 },
        { hour: 19, minute: 10, templateId: "tpl_backbending", instructorId: "ins_krish", capacity: 15, pre: 9 }
    ],
    27: [
        { hour: 16, minute: 0, templateId: "tpl_hip_opening", instructorId: "ins_shubham", capacity: 15, pre: 12 },
        { hour: 17, minute: 10, templateId: "tpl_balance_flow", instructorId: "ins_shubham", capacity: 15, pre: 11 }
    ],
    28: [{ hour: 9, minute: 0, templateId: "tpl_inversion_special", instructorId: "ins_ex", capacity: 15, pre: 13, durationMin: 180 }],

    // Week 5 (Monday June 29th to Tuesday June 30th)
    29: [{ hour: 7, minute: 0, templateId: "tpl_gentle_flow", instructorId: "ins_shubham", capacity: 15, pre: 10 }],
    30: [{ hour: 7, minute: 0, templateId: "tpl_twist", instructorId: "ins_nop", capacity: 15, pre: 8 }]
};

let occurrenceCache: ClassOccurrence[] | null = null;

function ensureOccurrences(): ClassOccurrence[] {
    if (occurrenceCache) return occurrenceCache;
    const out: ClassOccurrence[] = [];
    for (let mday = 1; mday <= 30; mday++) {
        const dateStr = `2026-06-${String(mday).padStart(2, "0")}`;
        const slots = DAILY_SCHEDULE_MAP[mday] || [];
        slots.forEach((slot, i) => {
            const localStart = new Date(`${dateStr}T${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}:00`);
            const startsAt = fromZonedTime(localStart, STUDIO_TZ);
            const classData = CLASS_DATA[slot.templateId];
            const durationMin = slot.durationMin ?? classData.durationMin;
            out.push({
                id: `occ_${dateStr}_${i}`,
                instructorId: slot.instructorId,
                startsAt,
                durationMin,
                capacity: slot.capacity,
                bookedCount: slot.pre,
                name: classData.name,
                description: classData.description,
                tagline: classData.tagline,
                intensity: classData.intensity,
                isSpecial: classData.isSpecial,
            });
        });
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
    const instructor = INSTRUCTORS.find((i) => i.id === occ.instructorId)!;
    return {
        ...occ,
        instructor,
        slotsLeft: Math.max(0, occ.capacity - occ.bookedCount),
    };
}

export function getScheduleRange(): { from: Date; to: Date } {
    const from = fromZonedTime(new Date("2026-06-01T00:00:00"), STUDIO_TZ);
    const to = fromZonedTime(new Date("2026-06-30T23:59:59"), STUDIO_TZ);
    return { from, to };
}

export function getAllOccurrences(): OccurrenceView[] {
    return ensureOccurrences()
        .map(toView)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

