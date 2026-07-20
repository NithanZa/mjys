"use client";

import {
    PoseCard,
    QuoteCard,
    ThaiCalendarCard,
    TigerHeader,
    TigerPromoCard,
    WorkshopPromo,
} from "@/components/home";
import { MilestoneCelebrationCard } from "@/components/rewards";
import { HOME_CONTENT } from "@/lib/mock/home-content";
import { useMember } from "@/lib/profile/use-member";
import { getUnseenUnlockedMilestones } from "@/lib/rewards";
import { motion } from "motion/react";
import { useMemo, useCallback } from "react";

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut" as const,
        },
    },
};

export default function HomePage() {
    const { quoteOfWeek, poseOfWeek } = HOME_CONTENT;
    const { member, markCelebrated } = useMember();

    const celebratedNumbers = useMemo<number[]>(() => {
        if (!member) return [];
        const nums: number[] = [];
        if (member.celebratedLevels.includes("TIGER")) nums.push(20);
        if (member.celebratedLevels.includes("LEOPARD")) nums.push(50);
        if (member.celebratedLevels.includes("CAT")) nums.push(100);
        return nums;
    }, [member]);

    const seenMilestones = useMemo<string[]>(() => {
        if (!member) return [];
        const seen: string[] = [];
        if (celebratedNumbers.includes(20)) seen.push("tiger");
        if (celebratedNumbers.includes(50)) seen.push("leopard");
        if (celebratedNumbers.includes(100)) seen.push("century");
        return seen;
    }, [member, celebratedNumbers]);

    // Show the first unseen unlocked milestone, if any.
    const unseenMilestones = useMemo(() => {
        if (!member) return [];
        return getUnseenUnlockedMilestones(
            member.classesAttended,
            seenMilestones,
        );
    }, [member, seenMilestones]);

    const nextMilestone = unseenMilestones[0] ?? null;

    const handleDismiss = useCallback(async () => {
        if (!nextMilestone) return;
        const thresholdMap: Record<string, number> = {
            tiger: 20,
            leopard: 50,
            century: 100,
        };
        const threshold = thresholdMap[nextMilestone.code];
        if (threshold) {
            await markCelebrated(threshold);
        }
    }, [nextMilestone, markCelebrated]);

    return (
        <>
            <motion.div
                className="mx-auto flex w-full max-w-screen-sm flex-col gap-5 pb-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <TigerHeader />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <ThaiCalendarCard displayName={member?.displayName} />
                </motion.div>

                {nextMilestone && (
                    <motion.div variants={itemVariants}>
                        <MilestoneCelebrationCard
                            milestone={nextMilestone}
                            onDismiss={handleDismiss}
                        />
                    </motion.div>
                )}

                <motion.div variants={itemVariants}>
                    <TigerPromoCard
                        href="/promotion"
                        title="Promotion"
                        eyebrow="Special offers"
                        image="/tigers/LINE_ALBUM_tiger_260719_10.jpg"
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <TigerPromoCard
                        href="/contact"
                        title="Contact Us"
                        eyebrow="We'd love to hear from you"
                        image="/tigers/LINE_ALBUM_tiger_260719_16.jpg"
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <WorkshopPromo />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <QuoteCard
                        text={quoteOfWeek.text}
                        author={quoteOfWeek.author}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <PoseCard
                        name={poseOfWeek.name}
                        description={poseOfWeek.description}
                        imageUrl={poseOfWeek.imageUrl}
                    />
                </motion.div>
            </motion.div>
        </>
    );
}
