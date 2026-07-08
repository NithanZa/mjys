"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";
import { getLevel } from "@/lib/levels";
import { Button, Card, Badge, Sheet, Modal, Input } from "@/components/ui";
import {
    Users,
    Search,
    Phone,
    Mail,
    Calendar,
    Award,
    Plus,
    Tag,
    Clock,
    UserCheck,
    Check,
    ArrowUpRight,
    Loader,
    ChevronRight,
    Trash2,
} from "lucide-react";

interface Member {
    id: string;
    lineUserId: string;
    displayName: string;
    email: string;
    phone: string;
    classesAttended: number;
    level: "CAT" | "TIGER" | "LEOPARD";
    createdAt: string;
}

interface Package {
    id: string;
    classesRemaining: number | null;
    expiresAt: string;
    status: "ACTIVE" | "EXPIRED" | "EXHAUSTED";
    createdAt: string;
    offer: {
        name: string;
    };
}

interface Attendance {
    id: string;
    status: "BOOKED" | "CHECKED_IN" | "CANCELLED" | "NO_SHOW";
    checkedInAt: string | null;
    createdAt: string;
    classOccurrence: {
        startsAt: string;
        template: {
            name: string;
        };
        instructor: {
            name: string;
        };
    };
}

interface Milestone {
    id: string;
    unlockedAt: string;
    milestone: {
        name: string;
    };
}

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Details state
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [packages, setPackages] = useState<Package[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);

    // Manual Grant state
    const [grantModalOpen, setGrantSheetOpen] = useState(false);
    const [packageOffers, setPackageOffers] = useState<Array<{ id: string; name: string; priceTHB: number }>>([]);
    const [selectedOfferId, setSelectedOfferId] = useState("");
    const [submittingGrant, setSubmittingGrant] = useState(false);

    // Administrative Deletion state
    const [adminDeleteModalOpen, setAdminDeleteModalOpen] = useState(false);
    const [adminConfirmText, setAdminConfirmText] = useState("");
    const [isDeletingMember, setIsDeletingMember] = useState(false);

    // Administrative Reset state
    const [adminResetModalOpen, setAdminResetModalOpen] = useState(false);
    const [adminResetConfirmText, setAdminResetConfirmText] = useState("");
    const [isResettingMember, setIsResettingMember] = useState(false);

    const handleDeleteMember = async () => {
        if (!selectedMember || adminConfirmText.trim().toUpperCase() !== "DELETE") return;
        setIsDeletingMember(true);
        try {
            const res = await fetch(`/api/admin/members/${selectedMember.id}?action=delete`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("Member and all their associated data have been permanently deleted.");
                setAdminDeleteModalOpen(false);
                setSelectedMember(null);
                loadMembers(searchQuery);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete member.");
            }
        } catch (err) {
            console.error("Error deleting member:", err);
            alert("Network error.");
        } finally {
            setIsDeletingMember(false);
        }
    };

    const handleResetMember = async () => {
        if (!selectedMember || adminResetConfirmText.trim().toUpperCase() !== "WIPE") return;
        setIsResettingMember(true);
        try {
            const res = await fetch(`/api/admin/members/${selectedMember.id}?action=reset`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("Member's class history, packages, milestones, and payment slips have been completely wiped. Profile reset to brand new CAT level.");
                setAdminResetModalOpen(false);
                setSelectedMember(null);
                loadMembers(searchQuery);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to reset member.");
            }
        } catch (err) {
            console.error("Error resetting member:", err);
            alert("Network error.");
        } finally {
            setIsResettingMember(false);
        }
    };

    const loadMembers = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members);
            }
        } catch (error) {
            console.error("Failed to load members:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load member detail deep-dive
    const handleMemberClick = async (member: Member) => {
        setSelectedMember(member);
        setLoadingDetail(true);
        setPackages([]);
        setAttendances([]);
        setMilestones([]);

        try {
            const res = await fetch(`/api/admin/members/${member.id}`);
            if (res.ok) {
                const data = await res.json();
                setPackages(data.packages);
                setAttendances(data.attendances);
                setMilestones(data.milestones);
            }
        } catch (err) {
            console.error("Failed to load member profile:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Load package choices for manual grant modal
    const handleOpenGrantModal = async () => {
        setGrantSheetOpen(true);
        try {
            const res = await fetch("/api/admin/packages");
            if (res.ok) {
                const data = await res.json();
                setPackageOffers(data.offers.filter((o: any) => o.active));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGrantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember || !selectedOfferId) return;

        setSubmittingGrant(true);
        try {
            const res = await fetch(`/api/admin/members/${selectedMember.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageOfferId: selectedOfferId }),
            });

            if (res.ok) {
                alert("Package has been manually granted directly to the member!");
                setGrantSheetOpen(false);
                setSelectedOfferId("");
                // Refresh detail views
                handleMemberClick(selectedMember);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to grant package.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmittingGrant(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadMembers(searchQuery);
        }, 300); // debounce text searching

        return () => clearTimeout(timeout);
    }, [searchQuery, loadMembers]);

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto h-full font-sans">
            <div>
                <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                    Members Directory
                </h1>
                <p className="text-body-sm text-neutral-text-2">
                    Browse registered customers, view class attendance histories, unlocked milestones, or manually adjust credits.
                </p>
            </div>

            {/* SEARCH AND CONTROLS */}
            <div className="flex gap-4 items-center bg-neutral-card border border-neutral-line rounded-md p-3.5 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-text-3" />
                    <input
                        type="text"
                        placeholder="Search members by name, phone, or email…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-sm bg-neutral-bg border border-neutral-line text-neutral-text focus-visible:outline-primary-500 text-body-sm"
                    />
                </div>
            </div>

            {/* MEMBERS TABLE */}
            <div className="flex-grow min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Loader className="h-8 w-8 animate-spin text-primary-600" />
                        <span className="text-body-sm text-neutral-text-3 font-medium">Searching directory…</span>
                    </div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 border border-neutral-line rounded-md bg-neutral-card text-center">
                        <Users className="h-12 w-12 text-neutral-line mb-3" />
                        <p className="font-display text-h3 font-semibold text-neutral-ink">No members found</p>
                        <p className="font-sans text-caption text-neutral-text-3 max-w-md mt-1">
                            Your search query did not return any records. Try checking for typos or searching a different phone.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-neutral-line bg-neutral-card rounded-md shadow-sm">
                        <table className="w-full text-left border-collapse text-body-sm">
                            <thead>
                                <tr className="border-b border-neutral-line bg-neutral-bg font-display text-overline uppercase tracking-[0.08em] text-neutral-text-2">
                                    <th className="p-4">Customer Name</th>
                                    <th className="p-4">Contact Info</th>
                                    <th className="p-4">Tier Level</th>
                                    <th className="p-4">Attended Classes</th>
                                    <th className="p-4">Registered On</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-line">
                                {members.map((member) => {
                                    const createdLocal = toZonedTime(parseISO(member.createdAt), STUDIO_TZ);
                                    const levelInfo = getLevel(member.classesAttended);

                                    return (
                                        <tr key={member.id} className="hover:bg-primary-50/20 transition-all">
                                            <td className="p-4 font-display font-semibold text-neutral-ink">
                                                {member.displayName}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5 font-sans text-caption text-neutral-text-3">
                                                    <span>📞 {member.phone}</span>
                                                    <span>✉️ {member.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    tone={
                                                        member.level === "CAT"
                                                            ? "neutral"
                                                            : member.level === "TIGER"
                                                              ? "primary"
                                                              : "accent"
                                                    }
                                                    className="font-medium text-caption"
                                                >
                                                    {levelInfo.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4 font-semibold text-neutral-ink">
                                                {member.classesAttended} classes
                                            </td>
                                            <td className="p-4 text-neutral-text-2">
                                                {format(createdLocal, "d MMM yyyy")}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    rightIcon={<ChevronRight className="h-4 w-4" />}
                                                    onClick={() => handleMemberClick(member)}
                                                >
                                                    View Profile
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Sheet
                open={selectedMember !== null}
                onClose={() => {
                    setSelectedMember(null);
                    setAdminDeleteModalOpen(false);
                    setAdminResetModalOpen(false);
                }}
                title={selectedMember?.displayName ?? "Member Profile"}
            >
                {selectedMember && (
                    <div className="flex flex-col gap-6 mt-6 font-sans pb-4">
                        {/* Level progress strip */}
                        <div className="bg-primary-50/50 border border-primary-200 rounded-md p-4 flex justify-between items-center gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-primary-800 uppercase tracking-wider">
                                    Current Tier Level
                                </span>
                                <h3 className="font-display text-h3 font-bold text-neutral-ink mt-0.5">
                                    {getLevel(selectedMember.classesAttended).label}
                                </h3>
                                <p className="text-caption text-neutral-text-2 mt-1">
                                    Progress: {selectedMember.classesAttended} classes attended total.
                                    {getLevel(selectedMember.classesAttended).next && (
                                        <span> Only {getLevel(selectedMember.classesAttended).remaining} left to reach next rank!</span>
                                    )}
                                </p>
                            </div>
                            <Award className="h-10 w-10 text-primary-500 shrink-0" />
                        </div>

                        {/* Contact info details card */}
                        <Card className="border border-neutral-line p-4 flex flex-col gap-3">
                            <h3 className="font-display text-body font-semibold text-neutral-ink border-b border-neutral-line pb-2.5">
                                Registration Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-body-sm text-neutral-text-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-semibold text-neutral-text-3 uppercase tracking-wider">Phone Number</span>
                                    <span className="font-medium flex items-center gap-1.5"><Phone className="h-4 w-4 text-neutral-text-3" /> {selectedMember.phone}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-semibold text-neutral-text-3 uppercase tracking-wider">Email Address</span>
                                    <span className="font-medium flex items-center gap-1.5"><Mail className="h-4 w-4 text-neutral-text-3" /> {selectedMember.email}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Milestones & Achievements */}
                        <div className="border-t border-neutral-line pt-5 flex flex-col gap-3">
                            <h3 className="font-display text-body font-semibold text-neutral-ink flex items-center gap-2">
                                Unlocked Milestones & Achievements <Badge tone="primary">{milestones.length}</Badge>
                            </h3>
                            <div className="border border-neutral-line bg-neutral-card rounded-md p-3.5">
                                {loadingDetail ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader className="h-5 w-5 animate-spin text-neutral-text-3" />
                                    </div>
                                ) : milestones.length === 0 ? (
                                    <div className="text-center text-caption text-neutral-text-3 italic py-2">
                                        No milestones or toy rewards unlocked yet.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {milestones.map((m) => (
                                            <div
                                                key={m.id}
                                                className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-800 rounded-sm px-2.5 py-1 text-caption font-medium"
                                            >
                                                <Award className="h-3.5 w-3.5 text-primary-500" />
                                                <span>{m.milestone.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pass adjustments */}
                        <div className="border-t border-neutral-line pt-5 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-display text-body font-semibold text-neutral-ink">
                                    Active Packages & Passes
                                </h3>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon={<Plus className="h-4 w-4" />}
                                    onClick={handleOpenGrantModal}
                                >
                                    Grant Package Pass
                                </Button>
                            </div>

                            <div className="border border-neutral-line bg-neutral-card rounded-md min-h-[80px] overflow-hidden">
                                {loadingDetail ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader className="h-5 w-5 animate-spin text-neutral-text-3" />
                                    </div>
                                ) : packages.length === 0 ? (
                                    <div className="p-8 text-center text-caption text-neutral-text-3 italic">
                                        No package passes purchased yet.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-neutral-line">
                                        {packages.map((pkg) => {
                                            const isExpired = new Date(pkg.expiresAt) < new Date();
                                            const isExhausted = pkg.classesRemaining === 0;

                                            return (
                                                <li key={pkg.id} className="p-3.5 flex items-center justify-between gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-display text-body-sm font-semibold text-neutral-ink">
                                                            {pkg.offer.name}
                                                        </span>
                                                        <span className="font-sans text-caption text-neutral-text-3 mt-0.5">
                                                            Granted on {format(toZonedTime(parseISO(pkg.createdAt), STUDIO_TZ), "d MMM yyyy")} · Expires {format(toZonedTime(parseISO(pkg.expiresAt), STUDIO_TZ), "d MMM yyyy")}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <Badge
                                                            tone={
                                                                pkg.status === "ACTIVE" && !isExpired
                                                                    ? "success"
                                                                    : "neutral"
                                                            }
                                                        >
                                                            {isExpired
                                                                ? "Expired"
                                                                : isExhausted
                                                                  ? "Exhausted"
                                                                  : `${pkg.classesRemaining ?? "Unlimited"} left`}
                                                        </Badge>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Recent class attendances history logs */}
                        <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-line pt-5">
                            <h3 className="font-display text-body font-semibold text-neutral-ink mb-3">
                                Attendance History Log
                            </h3>

                            <div className="flex-1 overflow-y-auto border border-neutral-line rounded-md bg-neutral-card min-h-[160px]">
                                {loadingDetail ? (
                                    <div className="flex items-center justify-center h-full p-8">
                                        <Loader className="h-5 w-5 animate-spin text-neutral-text-3" />
                                    </div>
                                ) : attendances.length === 0 ? (
                                    <div className="p-8 text-center text-caption text-neutral-text-3 italic h-full flex items-center justify-center">
                                        Roster log is empty. This member hasn&apos;t booked any classes yet.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-neutral-line">
                                        {attendances.map((att) => {
                                            const localStarts = toZonedTime(parseISO(att.classOccurrence.startsAt), STUDIO_TZ);
                                            return (
                                                <li key={att.id} className="p-3 flex items-center justify-between gap-4 hover:bg-neutral-bg/30">
                                                    <div className="flex flex-col">
                                                        <span className="font-display text-body-sm font-semibold text-neutral-ink leading-tight">
                                                            {att.classOccurrence.template.name}
                                                        </span>
                                                        <span className="font-sans text-caption text-neutral-text-3 mt-0.5">
                                                            {format(localStarts, "EEEE, d MMM yyyy · HH:mm")} with {att.classOccurrence.instructor.name}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        tone={
                                                            att.status === "CHECKED_IN"
                                                                ? "success"
                                                                : att.status === "BOOKED"
                                                                  ? "primary"
                                                                  : att.status === "CANCELLED"
                                                                    ? "neutral"
                                                                    : "error"
                                                        }
                                                        className="text-caption shrink-0"
                                                    >
                                                        {att.status === "CHECKED_IN"
                                                            ? "Attended"
                                                            : att.status === "BOOKED"
                                                              ? "Upcoming"
                                                              : att.status === "CANCELLED"
                                                                ? "Cancelled"
                                                                : "No Show"}
                                                    </Badge>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Danger zone / deletion */}
                        <div className="border-t border-red-100 pt-5 mt-4">
                            <h3 className="font-display text-body font-bold text-error-fg mb-2 flex items-center gap-1.5">
                                <Trash2 className="h-4 w-4" /> Danger Zone
                            </h3>
                            <p className="font-sans text-caption text-neutral-text-3 mb-4 leading-relaxed">
                                Choose whether to reset the customer&apos;s activity so they can start fresh, or completely erase their entire presence and account from the system.
                            </p>
                            <div className="flex flex-col gap-2.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setAdminResetModalOpen(true);
                                        setAdminResetConfirmText("");
                                    }}
                                    className="w-full text-caption h-10 rounded-sm font-semibold border-error-border text-error-fg hover:bg-error-bg/5"
                                >
                                    Wipe Activity & Reset as New (Keep Login)
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        setAdminDeleteModalOpen(true);
                                        setAdminConfirmText("");
                                    }}
                                    className="w-full text-caption h-10 rounded-sm font-semibold"
                                >
                                    Delete Member Completely (Erase Everything)
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Sheet>

            {/* MANUAL GRANT MODAL */}
            <Modal
                open={grantModalOpen}
                onClose={() => setGrantSheetOpen(false)}
                title="Grant Package Pass Manually"
            >
                {selectedMember && (
                    <form onSubmit={handleGrantSubmit} className="flex flex-col gap-5 max-w-xl font-sans mt-4">
                        <div className="bg-warning-bg/30 border border-warning-border rounded-md p-3.5 flex gap-2.5 items-start text-caption text-warning-fg">
                            <Award className="h-5 w-5 shrink-0 mt-0.5 text-warning-fg" />
                            <div className="flex flex-col">
                                <span className="font-bold">Administrative Override</span>
                                <span className="mt-0.5">
                                    Manually granting a package allocates it directly to the customer&apos;s active balances. Use this for physical cash payments at the counter or special loyalty awards.
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-caption font-semibold text-neutral-text-3 uppercase tracking-wider">Target Member</span>
                            <span className="font-display text-body font-bold text-neutral-ink">{selectedMember.displayName}</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Select Active Offer</label>
                            <select
                                required
                                value={selectedOfferId}
                                onChange={(e) => setSelectedOfferId(e.target.value)}
                                className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                            >
                                <option value="">-- Choose Package --</option>
                                {packageOffers.map((offer) => (
                                    <option key={offer.id} value={offer.id}>
                                        {offer.name} (฿{offer.priceTHB.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-2 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setGrantSheetOpen(false)}
                                disabled={submittingGrant}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={submittingGrant}
                                disabled={submittingGrant}
                            >
                                Grant Active Pass
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ADMIN RESET MODAL */}
            <Modal
                open={adminResetModalOpen && !!selectedMember}
                onClose={() => !isResettingMember && setAdminResetModalOpen(false)}
                title={
                    <span className="text-warning-fg font-bold flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> Wipe Activity & Reset?
                    </span>
                }
            >
                {selectedMember && (
                    <div className="flex flex-col gap-4 font-sans text-body-sm text-neutral-text-2 mt-2">
                        <p className="font-semibold text-neutral-ink">
                            Are you sure you want to reset <span className="font-bold">{selectedMember.displayName}</span>?
                        </p>
                        <p className="text-caption text-neutral-text-2 bg-warning-bg/10 border border-warning-border rounded-sm p-3">
                            <strong>This will permanently delete:</strong>
                            <span className="block mt-1">
                                • All active/remaining packages and passes<br />
                                • Entire class attendance/booking logs<br />
                                • Earned toy rewards and milestones<br />
                                • All uploaded transfer payment slips
                            </span>
                            <span className="block mt-2 font-medium">
                                Contact credentials, registration date, and LINE Auth links will be preserved. The customer will start over as a brand new CAT level user.
                            </span>
                        </p>

                        <div className="flex flex-col gap-1.5 border-t border-neutral-line pt-4">
                            <label className="text-caption font-semibold text-neutral-ink uppercase tracking-wider">
                                Type <span className="text-warning-fg font-bold">WIPE</span> to confirm:
                            </label>
                            <Input
                                type="text"
                                placeholder="Type WIPE"
                                value={adminResetConfirmText}
                                onChange={(e) => setAdminResetConfirmText(e.target.value.toUpperCase())}
                                disabled={isResettingMember}
                                className="text-center font-bold tracking-widest uppercase focus-visible:outline-warning-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-2 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAdminResetModalOpen(false)}
                                disabled={isResettingMember}
                                className="h-10 text-caption rounded-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleResetMember}
                                loading={isResettingMember}
                                disabled={isResettingMember || adminResetConfirmText.trim().toUpperCase() !== "WIPE"}
                                className="h-10 text-caption rounded-sm font-semibold border-warning-border text-warning-fg hover:bg-warning-bg/5"
                            >
                                Wipe & Reset
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ADMIN DELETE MODAL */}
            <Modal
                open={adminDeleteModalOpen && !!selectedMember}
                onClose={() => !isDeletingMember && setAdminDeleteModalOpen(false)}
                title={
                    <span className="text-error-fg font-bold flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> Delete Member Profile?
                    </span>
                }
            >
                {selectedMember && (
                    <div className="flex flex-col gap-4 font-sans text-body-sm text-neutral-text-2 mt-2">
                        <p className="font-semibold text-neutral-ink">
                            Are you absolutely sure you want to delete <span className="font-bold">{selectedMember.displayName}</span>?
                        </p>
                        <p className="text-caption text-neutral-text-2 bg-error-bg/10 border border-error-border rounded-sm p-3">
                            <strong>Warning:</strong> This administrative action cannot be undone. All their remaining classes, purchase history, reward collections, uploaded payment slips, and future bookings will be completely wiped. Their LINE/Supabase login credentials will also be permanently deleted.
                        </p>

                        <div className="flex flex-col gap-1.5 border-t border-neutral-line pt-4">
                            <label className="text-caption font-semibold text-neutral-ink uppercase tracking-wider">
                                Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
                            </label>
                            <Input
                                type="text"
                                placeholder="Type DELETE"
                                value={adminConfirmText}
                                onChange={(e) => setAdminConfirmText(e.target.value.toUpperCase())}
                                disabled={isDeletingMember}
                                className="text-center font-bold tracking-widest uppercase focus-visible:outline-red-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-2 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAdminDeleteModalOpen(false)}
                                disabled={isDeletingMember}
                                className="h-10 text-caption rounded-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteMember}
                                loading={isDeletingMember}
                                disabled={isDeletingMember || adminConfirmText.trim().toUpperCase() !== "DELETE"}
                                className="h-10 text-caption rounded-sm font-semibold"
                            >
                                Permanent Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
