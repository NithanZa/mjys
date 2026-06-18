import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("Neither DIRECT_URL nor DATABASE_URL is set in environment.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INSTRUCTORS = [
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

const CLASS_TEMPLATES = [
    {
        id: "tpl_easy_flow",
        name: "Easy Flow",
        description: "A gentle and slow-paced flow focused on foundational postures, alignment, and simple transitions. Perfect for beginners and those seeking a mindful, relaxing practice.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Find your flow, ease your mind.",
        isSpecial: false,
    },
    {
        id: "tpl_morning_stretching",
        name: "Morning Stretching",
        description: "Awaken your body with gentle stretches and movements that release tension built up during sleep. Great for flexibility and starting the day with energy.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Awaken and energize.",
        isSpecial: false,
    },
    {
        id: "tpl_open_shoulder",
        name: "Open Shoulder",
        description: "Targeted stretches and strengthening postures to open up the shoulders, neck, and upper back, relieving tension from desk work and poor posture.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Release tension, open your heart.",
        isSpecial: false,
    },
    {
        id: "tpl_stretching",
        name: "Stretching",
        description: "A full-body stretching session designed to improve overall flexibility, enhance range of motion, and promote deep relaxation of tight muscles.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Lengthen and loosen.",
        isSpecial: false,
    },
    {
        id: "tpl_hatha_flow",
        name: "Hatha Flow",
        description: "A classic practice integrating breath with holding postures to build strength, balance, and mental clarity. Conducted at a steady, deliberate pace.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Balance strength and stillness.",
        isSpecial: false,
    },
    {
        id: "tpl_vinyasa",
        name: "Vinyasa Flow",
        description: "A breath-paced flow that builds heat, strength, and a quiet mind. Suitable for steady beginners and confident regulars.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Move with the breath.",
        isSpecial: false,
    },
    {
        id: "tpl_strong_core",
        name: "Strong Core",
        description: "A dynamic yoga session emphasizing core strength, stability, and abdominal power. Prepare to sweat and build deep core heat.",
        durationMin: 60,
        intensity: "Strong",
        tagline: "Build strength from within.",
        isSpecial: false,
    },
    {
        id: "tpl_office_syndrome",
        name: "Office Syndrome",
        description: "Specially designed for office workers to target common problem areas: neck, shoulders, back, and hips. Alleviate chronic pain and stiffness.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Relieve tension from desk work.",
        isSpecial: false,
    },
    {
        id: "tpl_side_bend",
        name: "Side Bend",
        description: "Focus on lateral stretches and spine elongation to expand lung capacity, open up the ribs, and improve side body flexibility.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Stretch and expand your sides.",
        isSpecial: false,
    },
    {
        id: "tpl_flexibility",
        name: "Flexibility",
        description: "Focuses on deep stretches and passive holds to improve flexibility, release deep tissue tightness, and increase joint mobility.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Unlock your body's flexibility.",
        isSpecial: false,
    },
    {
        id: "tpl_backbending",
        name: "Backbending",
        description: "Learn the anatomy and mechanics of safe backbends. Strengthen the spine, open the chest, and build flexibility in a controlled and safe environment.",
        durationMin: 60,
        intensity: "Strong",
        tagline: "Open your front, strengthen your back.",
        isSpecial: false,
    },
    {
        id: "tpl_hip_opening",
        name: "Hip Opening",
        description: "A deep, nourishing practice focused entirely on opening the hips, releasing stored physical and emotional tension.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Release tension in the hips.",
        isSpecial: false,
    },
    {
        id: "tpl_balance_flow",
        name: "Balance Flow",
        description: "A flowing sequence emphasizing both physical and mental balance. Connect with your center through steady standing poses and transitions.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Find your steady center.",
        isSpecial: false,
    },
    {
        id: "tpl_inversion_special",
        name: "* Special Class * Inversion",
        description: "A 3-hour comprehensive workshop breaking down headstands, forearm stands, and handstands with step-by-step progressions, safety, and alignment.",
        durationMin: 180,
        intensity: "Strong",
        tagline: "Invert your practice with safety.",
        isSpecial: true,
    },
    {
        id: "tpl_gentle_flow",
        name: "Gentle Flow",
        description: "A soft, nurturing yoga practice featuring gentle movements and breathing exercises to calm the nervous system and build gentle strength.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Be kind to your body.",
        isSpecial: false,
    },
    {
        id: "tpl_twist",
        name: "Twist",
        description: "A detoxifying sequence of seated and standing twists designed to massage internal organs, improve digestion, and restore spinal mobility.",
        durationMin: 60,
        intensity: "Balanced",
        tagline: "Twist, detoxify, and restore.",
        isSpecial: false,
    },
    {
        id: "tpl_breath",
        name: "Breath & Restore",
        description: "A slow, restorative practice combining gentle shapes with long pranayama. Perfect after a long day or as a Sunday reset.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Breathe out the week.",
        isSpecial: false,
    },
    {
        id: "tpl_strong",
        name: "Strong Practice",
        description: "Ashtanga-inspired, builds deep core heat, strength, and structural focus. High intensity.",
        durationMin: 75,
        intensity: "Strong",
        tagline: "Earn your stillness.",
        isSpecial: false,
    },
    {
        id: "tpl_yin",
        name: "Yin & Sound",
        description: "Long, supported holds paired with a closing sound bath. A deep release for fascia and nervous system both.",
        durationMin: 60,
        intensity: "Gentle",
        tagline: "Settle, soften, surrender.",
        isSpecial: false,
    },
    {
        id: "tpl_handstand_mc",
        name: "Handstand MC",
        description: "A specialized workshop targeting the core, shoulders, and wrist prep required for solid handstands.",
        durationMin: 90,
        intensity: "Strong",
        tagline: "Turn your world upside down.",
        isSpecial: true,
    },
    {
        id: "tpl_scorpion_mc",
        name: "Scorpion MC",
        description: "Learn to transition seamlessly from forearm stand to scorpion with safety and control.",
        durationMin: 90,
        intensity: "Strong",
        tagline: "Deepen your backbend.",
        isSpecial: true,
    },
];

const PACKAGE_OFFERS = [
    {
        id: "pkg_walkin",
        name: "Walk-in",
        type: "WALK_IN" as const,
        priceTHB: 500,
        classCount: 1,
        validityDays: 7,
        tagline: "One class, no commitment.",
        perks: ["1 class", "Valid 7 days", "Any class style"],
        highlight: false,
        sortOrder: 1,
    },
    {
        id: "pkg_5",
        name: "5-Class Pack",
        type: "CLASSES_5" as const,
        priceTHB: 2250,
        classCount: 5,
        validityDays: 30,
        tagline: "Perfect for a short series.",
        perks: ["5 classes", "Valid 30 days", "Save ฿250 vs walk-in"],
        highlight: false,
        sortOrder: 2,
    },
    {
        id: "pkg_10",
        name: "10-Class Pack",
        type: "CLASSES_10" as const,
        priceTHB: 4000,
        classCount: 10,
        validityDays: 60,
        tagline: "Build a steady weekly practice.",
        perks: ["10 classes", "Valid 60 days", "Save ฿1,000 vs walk-in"],
        highlight: true,
        sortOrder: 3,
    },
    {
        id: "pkg_20",
        name: "20-Class Pack",
        type: "CLASSES_20" as const,
        priceTHB: 7000,
        classCount: 20,
        validityDays: 120,
        tagline: "For the regulars.",
        perks: ["20 classes", "Valid 120 days", "Save ฿3,000 vs walk-in"],
        highlight: false,
        sortOrder: 4,
    },
];

async function main() {
    console.log("🌱 Starting seeding...");

    // 1. Seed Instructors
    for (const inst of INSTRUCTORS) {
        await prisma.instructor.upsert({
            where: { id: inst.id },
            update: inst,
            create: inst,
        });
    }
    console.log("✅ Seeded Instructors");

    // 2. Seed Class Templates
    for (const tpl of CLASS_TEMPLATES) {
        await prisma.classTemplate.upsert({
            where: { id: tpl.id },
            update: tpl,
            create: tpl,
        });
    }
    console.log("✅ Seeded Class Templates");

    // 3. Seed Package Offers
    for (const pkg of PACKAGE_OFFERS) {
        await prisma.packageOffer.upsert({
            where: { id: pkg.id },
            update: pkg,
            create: pkg,
        });
    }
    console.log("✅ Seeded Package Offers");

    // 4. Seed HomeContent Singleton
    await prisma.homeContent.upsert({
        where: { id: "singleton" },
        update: {},
        create: {
            id: "singleton",
            heroTitle: "MiTR Journey",
            heroSubtitle: "Discover the strength and soul within your everyday journey.",
            quoteText: "Yoga is not about touching your toes, it is about what you learn on the way down.",
            quoteAuthor: "Jigar Gor",
            poseName: "Hero Pose (Virasana)",
            poseDescription: "A kneeling posture that stretches the thighs and ankles while building calm, meditative focus.",
            poseImageUrl: null,
            bannerImageUrl: null,
            bannerHref: "/promotion",
        },
    });
    console.log("✅ Seeded Home Content");

    // 5. Seed ToyParts
    const TOY_PARTS = [
        { id: "toy_head", code: "head", name: "Tiger Toy Head", sortOrder: 1 },
        { id: "toy_torso", code: "torso", name: "Tiger Toy Torso", sortOrder: 2 },
        { id: "toy_limbs", code: "limbs", name: "Tiger Toy Limbs", sortOrder: 3 },
        { id: "toy_tail", code: "tail", name: "Tiger Toy Tail", sortOrder: 4 },
    ];
    for (const part of TOY_PARTS) {
        await prisma.toyPart.upsert({
            where: { id: part.id },
            update: part,
            create: part,
        });
    }
    console.log("✅ Seeded Toy Parts");

    // 6. Seed Milestones
    const MILESTONES = [
        { id: "ms_tiger", code: "tiger", name: "Tiger Rank Milestone", requirement: { classes: 20 } },
        { id: "ms_leopard", code: "leopard", name: "Leopard Rank Milestone", requirement: { classes: 50 } },
        { id: "ms_century", code: "century", name: "100 Club Milestone", requirement: { classes: 100 } },
    ];
    for (const ms of MILESTONES) {
        await prisma.milestone.upsert({
            where: { id: ms.id },
            update: ms,
            create: ms,
        });
    }
    console.log("✅ Seeded Milestones");

    // 7. Seed Class Occurrences for June 2026
    console.log("📅 Generating Class Occurrences for June 2026...");

    // Delete existing occurrences first to prevent primary key duplicates or bloat on multiple seeds
    await prisma.classOccurrence.deleteMany({});

    const DAILY_SCHEDULE_MAP: { [mday: number]: { hour: number; minute: number; templateId: string; instructorId: string; capacity: number; pre: number; durationMin?: number }[] } = {
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

    for (let mday = 1; mday <= 30; mday++) {
        const dateStr = `2026-06-${String(mday).padStart(2, "0")}`;
        const slots = DAILY_SCHEDULE_MAP[mday] || [];
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const startsAt = new Date(`${dateStr}T${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}:00+07:00`);
            const template = CLASS_TEMPLATES.find((t) => t.id === slot.templateId)!;
            const durationMin = slot.durationMin ?? template.durationMin;

            await prisma.classOccurrence.create({
                data: {
                    id: `occ_${dateStr}_${i}`,
                    templateId: slot.templateId,
                    instructorId: slot.instructorId,
                    startsAt,
                    durationMin,
                    capacity: slot.capacity,
                    bookedCount: slot.pre,
                },
            });
        }
    }

    console.log("✅ Seeded Class Occurrences for June 2026 successfully!");
    console.log("🌿 Database seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });
