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

const CLASS_TEMPLATES = [
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
        id: "tpl_vinyasa",
        name: "Vinyasa Flow",
        description: "A breath-paced flow that builds heat, strength, and a quiet mind. Suitable for steady beginners and confident regulars.",
        durationMin: 75,
        intensity: "Balanced",
        tagline: "Move with the breath.",
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

const WEEKDAY_SLOTS = [
    { hour: 9, minute: 0, templateId: "tpl_breath", instructorId: "ins_nop", capacity: 12, pre: 4 },
    { hour: 18, minute: 30, templateId: "tpl_vinyasa", instructorId: "ins_shubham", capacity: 14, pre: 9 },
];

const WEEKEND_SLOTS = [
    { hour: 8, minute: 0, templateId: "tpl_strong", instructorId: "ins_anup", capacity: 12, pre: 12 },
    { hour: 17, minute: 0, templateId: "tpl_yin", instructorId: "ins_nop", capacity: 16, pre: 7 },
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

    // 7. Seed Class Occurrences for the next 30 days
    const today = setSeconds(setMinutes(setHours(new Date(), 0), 0), 0);
    console.log("📅 Generating 30 days of class occurrences...");

    // Delete existing occurrences first to prevent primary key duplicates or bloat on multiple seeds
    await prisma.classOccurrence.deleteMany({});

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const currentDate = addDays(today, dayOffset);
        const dow = currentDate.getDay(); // 0 Sun, 6 Sat
        const mday = currentDate.getDate();

        if (dow === 0) {
            // Sunday Special Masterclass!
            const templateId = mday % 2 === 0 ? "tpl_handstand_mc" : "tpl_scorpion_mc";
            const preBooked = mday % 2 === 0 ? 12 : 10;
            const startsAt = setSeconds(setMinutes(setHours(currentDate, 9), 0), 0);

            await prisma.classOccurrence.create({
                data: {
                    id: `occ_${currentDate.toISOString().slice(0, 10)}_0`,
                    templateId,
                    instructorId: "ins_x",
                    startsAt,
                    durationMin: 90,
                    capacity: 15,
                    bookedCount: preBooked,
                },
            });
        } else {
            const slots = dow === 6 ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                const startsAt = setSeconds(setMinutes(setHours(currentDate, slot.hour), slot.minute), 0);

                await prisma.classOccurrence.create({
                    data: {
                        id: `occ_${currentDate.toISOString().slice(0, 10)}_${i}`,
                        templateId: slot.templateId,
                        instructorId: slot.instructorId,
                        startsAt,
                        durationMin: slot.templateId === "tpl_vinyasa" ? 75 : 60,
                        capacity: slot.capacity,
                        bookedCount: slot.pre,
                    },
                });
            }
        }
    }

    console.log("✅ Seeded 30 days of Class Occurrences successfully!");
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
