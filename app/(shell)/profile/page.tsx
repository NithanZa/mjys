"use client";

import { TopBar } from "@/components/layout";
import {
    CelebrationToast,
    ClassCountSlider,
    LevelProgress,
    MemberQRCard,
    NextClassStrip,
    PackageAlertBanner,
    ProfileHeroCard,
    RegistrationForm,
    StatsRow,
} from "@/components/profile";
import { RecentActivityList } from "@/components/rewards";
import { Button, Card, EmptyState } from "@/components/ui";
import { useLiff } from "@/lib/liff";
import { getLevel } from "@/lib/levels";
import { getRecentActivity } from "@/lib/mock/activity";
import { getNextBooking } from "@/lib/mock/bookings-store";
import { useMockMember } from "@/lib/profile/mock-store";
import { usePurchases } from "@/lib/mock/purchases-store";
import { LockIcon, LogOut, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const CELEBRATION_MESSAGES: Record<number, string> = {
    20: "Welcome to the Tiger pack. You earned it.",
    50: "Leopard unlocked. Your practice shines.",
    100: "100 Club. You are the heart of MiTR.",
};

const DEV = process.env.NODE_ENV !== "production";

export default function ProfilePage() {
    const { status, isInClient, error: liffError } = useLiff();
    const { member, register, addClasses, markCelebrated, reset } =
        useMockMember();
    const { activePackage } = usePurchases();
    const [devRegOpen, setDevRegOpen] = useState(false);

    // Derive the active celebration from member state — no useEffect needed.
    // The mock store updates `celebrated` on dismiss, which naturally clears this,
    // and the next uncelebrated threshold (if any) takes its place.
    const pendingCelebration = useMemo<number | null>(() => {
        if (!member) return null;
        return (
            [20, 50, 100].find(
                (t) =>
                    member.classesAttended >= t &&
                    !member.celebrated.includes(t),
            ) ?? null
        );
    }, [member]);

    function dismissCelebration() {
        if (pendingCelebration !== null) markCelebrated(pendingCelebration);
    }

    // AC6 — non-LINE fallback. Allow "continue anyway" so devs can still test.
    const [bypassLineCheck, setBypassLineCheck] = useState(false);
    const showLineFallback =
        status === "ready" && !isInClient && !bypassLineCheck && !member;

    // Loading skeleton until LIFF has settled. The mock store is sync (localStorage)
    // so its value is available on first client render via useSyncExternalStore.
    if (status === "loading") {
        return (
            <>
                <TopBar title="Profile" />
                <Card>
                    <p className="font-sans text-body text-neutral-text-2">
                        Loading…
                    </p>
                </Card>
            </>
        );
    }

    if (status === "error") {
        return (
            <>
                <TopBar title="Profile" />
                <EmptyState
                    icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
                    title="Couldn't connect to LINE"
                    description={
                        liffError ?? "Try reopening this page from inside LINE."
                    }
                />
            </>
        );
    }

    if (showLineFallback) {
        return (
            <>
                <TopBar title="Profile" />
                <EmptyState
                    icon={<Smartphone strokeWidth={1.75} className="h-6 w-6" />}
                    title="Open in LINE to continue"
                    description="Your MiTR member profile is tied to your LINE account. Open this link inside the LINE app to register."
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBypassLineCheck(true)}
                        >
                            Continue anyway (dev)
                        </Button>
                    }
                />
            </>
        );
    }

    if (!member) {
        return (
            <>
                <TopBar title="Welcome" />
                <RegistrationForm
                    onSubmit={({
                        displayName,
                        email,
                        phone,
                        dob,
                        address,
                        tocAccepted,
                        lineUserId,
                    }) => {
                        register({
                            displayName,
                            email,
                            phone,
                            dob,
                            address,
                            tocAccepted,
                            lineUserId,
                        });
                    }}
                />
            </>
        );
    }

    const level = getLevel(member.classesAttended);
    const recentActivity = getRecentActivity(member.classesAttended).slice(
        0,
        4,
    );
    const nextBooking = getNextBooking();

    return (
        <>
            <TopBar
                title="Profile"
                right={
                    <button
                        type="button"
                        onClick={reset}
                        aria-label="Reset profile (dev)"
                        className="text-neutral-text-3 hover:text-neutral-text-2"
                    >
                        <LogOut strokeWidth={1.75} className="h-5 w-5" />
                    </button>
                }
            />

            <div className="flex flex-col gap-4">
                {/* 1. Hero header */}
                <ProfileHeroCard
                    displayName={member.displayName}
                    email={member.email}
                    classesAttended={member.classesAttended}
                />

                {/* 2. Package expiry alert (shows only when ≤7 days left) */}
                {activePackage && activePackage.expiresAt && (
                    <PackageAlertBanner
                        packageName={activePackage.offer.name}
                        expiresAt={activePackage.expiresAt.toISOString()}
                        classesRemaining={activePackage.classesRemaining ?? 0}
                    />
                )}

                {/* 3. Next class strip */}
                {nextBooking && (
                    <NextClassStrip
                        className_={nextBooking.template.name}
                        instructorName={nextBooking.instructor.name}
                        startsAt={nextBooking.startsAt}
                        durationMin={nextBooking.durationMin}
                    />
                )}

                {/* 4. Stats row */}
                <StatsRow classesAttended={member.classesAttended} />

                {/* 5. Level progress */}
                <Card>
                    <LevelProgress
                        info={level}
                        classesAttended={member.classesAttended}
                    />
                </Card>

                {/* 6. Dev: class count slider */}
                {DEV && (
                    <Card elevation="sm">
                        <ClassCountSlider
                            value={member.classesAttended}
                            onChange={(v) =>
                                addClasses(v - member.classesAttended)
                            }
                        />
                    </Card>
                )}

                {/* 7. Recent classes (latest 4 inline) */}
                <Card>
                    <div className="mb-3 flex items-baseline justify-between">
                        <h2 className="font-display text-h3 font-medium text-neutral-ink">
                            Recent classes
                        </h2>
                        <Link
                            href="/profile/my-classes"
                            className="font-sans text-caption font-medium text-primary-700 hover:text-primary-800"
                        >
                            View all
                        </Link>
                    </div>
                    <RecentActivityList items={recentActivity} />
                </Card>

                {/* 8. Member QR */}
                <MemberQRCard memberId={member.id} />

                {/* 9. Privacy note */}
                <p className="text-center font-sans text-caption text-neutral-text-3">
                    <LockIcon
                        strokeWidth={1.75}
                        className="mr-1 inline h-3 w-3"
                        aria-hidden
                    />
                    Your profile and class history are private — only visible to
                    you.
                </p>

                {/* 10. Dev: new member registration collapsible */}
                {DEV && (
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => setDevRegOpen((o) => !o)}
                            className="w-full rounded-xl bg-primary-600 py-3 font-sans text-body font-semibold text-white"
                        >
                            🌿 New Member Registration {devRegOpen ? "▲" : "▼"}
                        </button>
                        {devRegOpen && (
                            <RegistrationForm
                                onSubmit={({
                                    displayName,
                                    email,
                                    phone,
                                    dob,
                                    address,
                                    tocAccepted,
                                    lineUserId,
                                }) => {
                                    register({
                                        displayName,
                                        email,
                                        phone,
                                        dob,
                                        address,
                                        tocAccepted,
                                        lineUserId,
                                    });
                                    setDevRegOpen(false);
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            <CelebrationToast
                open={pendingCelebration !== null}
                threshold={pendingCelebration}
                message={
                    pendingCelebration !== null
                        ? (CELEBRATION_MESSAGES[pendingCelebration] ??
                          "Keep going.")
                        : ""
                }
                onClose={dismissCelebration}
            />
        </>
    );
}
