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
        <div className="flex flex-col gap-5">
            <HeroCard
                eyebrow={heroEyebrow}
                title={heroTitle}
                subtitle={heroSubtitle}
                tagline={heroTagline}
            />
            {nextMilestone && (
                <MilestoneCelebrationCard
                    milestone={nextMilestone}
                    onDismiss={() => markMilestoneSeen(nextMilestone.code)}
                />
            )}
            <QuoteCard text={quoteOfWeek.text} author={quoteOfWeek.author} />
            <PoseCard
                name={poseOfWeek.name}
                description={poseOfWeek.description}
                imageUrl={poseOfWeek.imageUrl}
            />
            <PromoBanner
                eyebrow={banner.eyebrow}
                title={banner.title}
                body={banner.body}
                href={banner.href}
                cta={banner.cta}
            />
            <ContactShortcut />
        </div>
    );
}
