"use client";

import {
    ContactShortcut,
    HeroCard,
    PoseCard,
    PromoBanner,
    QuoteCard,
} from "@/components/home";
import { MilestoneCelebrationCard } from "@/components/rewards";
import { HOME_CONTENT } from "@/lib/mock/home-content";
import { useMockMember } from "@/lib/profile/mock-store";
import { getUnseenUnlockedMilestones } from "@/lib/rewards";
import { motion } from "motion/react";

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
    const {
        heroEyebrow,
        heroTitle,
        heroSubtitle,
        heroTagline,
        banner,
        quoteOfWeek,
        poseOfWeek,
    } = HOME_CONTENT;
    const { member, markMilestoneSeen } = useMockMember();

    // Show the first unseen unlocked milestone, if any.
    const unseenMilestones = member
        ? getUnseenUnlockedMilestones(
              member.classesAttended,
              member.seenMilestones,
          )
        : [];
    const nextMilestone = unseenMilestones[0] ?? null;

    return (
        <>
            <motion.div
                className="flex flex-col gap-5 pb-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <HeroCard
                        eyebrow={heroEyebrow}
                        title={heroTitle}
                        subtitle={heroSubtitle}
                        tagline={heroTagline}
                    />
                </motion.div>

                {nextMilestone && (
                    <motion.div variants={itemVariants}>
                        <MilestoneCelebrationCard
                            milestone={nextMilestone}
                            onDismiss={() => markMilestoneSeen(nextMilestone.code)}
                        />
                    </motion.div>
                )}

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

                <motion.div variants={itemVariants}>
                    <PromoBanner
                        eyebrow={banner.eyebrow}
                        title={banner.title}
                        body={banner.body}
                        href={banner.href}
                        cta={banner.cta}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <ContactShortcut />
                </motion.div>
            </motion.div>
        </>
    );
}
