"use client";

import { TopBar } from "@/components/layout";
import {
    CelebrationToast,
    LevelProgress,
    MemberQRCard,
    NextClassStrip,
    PackageAlertBanner,
    ProfileHeroCard,
    StatsRow,
} from "@/components/profile";
import { RecentActivityList } from "@/components/rewards";
import { Button, Card, EmptyState, Modal, Input } from "@/components/ui";
import { useLiff } from "@/lib/liff";
import { getLevel } from "@/lib/levels";
import { useMember } from "@/lib/profile/use-member";
import { useClassHistory } from "@/lib/profile/use-class-history";
import { usePurchases } from "@/lib/mock/purchases-store";
import { LockIcon, LogOut, Smartphone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const CELEBRATION_MESSAGES: Record<number, string> = {
    20: "Welcome to the Tiger pack. You earned it.",
    50: "Leopard unlocked. Your practice shines.",
    100: "100 Club. You are the heart of MiTR.",
};

const DEV = process.env.NODE_ENV !== "production";

export default function ProfilePage() {
    const { status, isInClient, error: liffError, liff, isLoggedIn } = useLiff();
    const { member, loading, markCelebrated, reset, deleteAccount } =
        useMember();
    const { activePackage } = usePurchases();
    const { history: classHistory } = useClassHistory();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDeleteConfirm = async () => {
        if (confirmText.trim().toUpperCase() !== "DELETE") return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteAccount();
        } catch (err: any) {
            setDeleteError(err.message || "Failed to delete account");
            setIsDeleting(false);
        }
    };

    // Map DB celebratedLevels strings (Level enum) back to celebration thresholds
    const celebratedNumbers = useMemo<number[]>(() => {
        if (!member) return [];
        const nums: number[] = [];
        if (member.celebratedLevels.includes("TIGER")) nums.push(20);
        if (member.celebratedLevels.includes("LEOPARD")) nums.push(50);
        if (member.celebratedLevels.includes("CAT")) nums.push(100);
        return nums;
    }, [member]);

    // Derive the active celebration from member state — no useEffect needed.
    const pendingCelebration = useMemo<number | null>(() => {
        if (!member) return null;
        return (
            [20, 50, 100].find(
                (t) =>
                    member.classesAttended >= t &&
                    !celebratedNumbers.includes(t),
            ) ?? null
        );
    }, [member, celebratedNumbers]);

    function dismissCelebration() {
        if (pendingCelebration !== null) markCelebrated(pendingCelebration);
    }

    const nextBooking = useMemo(() => {
        const upcoming = classHistory
            .filter((item) => item.status === "BOOKED" && new Date(item.occurredAt).getTime() > Date.now())
            .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
        const raw = upcoming[0] ?? null;
        if (!raw) return null;
        return {
            ...raw,
            startsAt: raw.occurredAt,
            durationMin: raw.template.durationMin,
        };
    }, [classHistory]);

    const recentActivity = useMemo(() => {
        if (!member) return [];
        // Past activity: either not "BOOKED", or "BOOKED" but occurredAt is in the past.
        return classHistory
            .filter((item) => item.status !== "BOOKED" || new Date(item.occurredAt).getTime() <= Date.now())
            .slice(0, 4);
    }, [classHistory, member]);

    if (!member) {
        return null;
    }

    const level = getLevel(member.classesAttended);

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
                <StatsRow classesAttended={member.classesAttended} history={classHistory} />

                {/* 5. Level progress */}
                <Card>
                    <LevelProgress
                        info={level}
                        classesAttended={member.classesAttended}
                    />
                </Card>

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

                {/* 11. Danger Zone */}
                <Card className="border border-error-border bg-error-bg/10 p-5 mt-4">
                    <h3 className="font-display text-body font-bold text-error-fg flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Danger Zone
                    </h3>
                    <p className="font-sans text-caption text-neutral-text-2 mt-1.5 leading-relaxed">
                        Permanently delete your studio account, bookings, remaining class packages, rewards, and all personal data. This action is irreversible.
                    </p>
                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                setDeleteModalOpen(true);
                                setConfirmText("");
                                setDeleteError(null);
                            }}
                            className="w-full text-caption h-10 rounded-sm font-semibold"
                        >
                            Delete Account & Personal Data
                        </Button>
                    </div>
                </Card>

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

            <Modal
                open={deleteModalOpen}
                onClose={() => !isDeleting && setDeleteModalOpen(false)}
                title={
                    <span className="text-red-600 font-bold flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> Delete Your Account?
                    </span>
                }
            >
                <div className="flex flex-col gap-4 font-sans text-body-sm text-neutral-text-2 mt-2">
                    <p className="font-semibold text-neutral-ink">
                        This action is irreversible and will permanently delete:
                    </p>
                    <ul className="list-disc pl-5 flex flex-col gap-1 text-caption">
                        <li>Your member profile and credentials</li>
                        <li>All future and past class bookings ({classHistory.length} bookings)</li>
                        <li>All active and remaining class packages</li>
                        <li>All unlocked milestones and earned toy rewards</li>
                    </ul>

                    {deleteError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-sm p-3 text-caption">
                            {deleteError}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 border-t border-neutral-line pt-4">
                        <label className="text-caption font-semibold text-neutral-ink uppercase tracking-wider">
                            Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
                        </label>
                        <Input
                            type="text"
                            placeholder="Type DELETE"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            disabled={isDeleting}
                            className="text-center font-bold tracking-widest uppercase focus-visible:outline-red-500"
                        />
                    </div>

                    <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="h-10 text-caption rounded-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            loading={isDeleting}
                            disabled={isDeleting || confirmText.trim().toUpperCase() !== "DELETE"}
                            className="h-10 text-caption rounded-sm font-semibold"
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
