"use client";

import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STUDIO_TZ } from "@/lib/dates";
import { cn } from "@/lib/cn";
import {
    Button,
    Card,
    CardBody,
    Input,
    Sheet,
    Badge,
    Chip,
} from "@/components/ui";
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    User,
    Users,
    Trash2,
    AlertTriangle,
    Check,
    X,
    Loader,
    Sparkles,
    Upload,
    Download,
    FileSpreadsheet,
} from "lucide-react";
import { INTENSITIES, INTENSITY_LABELS } from "@/lib/intensity";

interface Occurrence {
    id: string;
    startsAt: string;
    durationMin: number;
    capacity: number;
    bookedCount: number;
    name: string;
    description: string;
    tagline: string;
    intensity: string;
    isSpecial: boolean;
    isCancelled: boolean;
    instructor: {
        id: string;
        name: string;
        initials: string;
    };
}

interface Instructor {
    id: string;
    name: string;
}

interface RosterItem {
    id: string;
    checkedInAt: string | null;
    member: {
        id: string;
        displayName: string;
        email: string;
        phone: string;
    };
}

export default function AdminCalendarPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet states
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [selectedOcc, setSelectedOcc] = useState<Occurrence | null>(null);
    const [roster, setRoster] = useState<RosterItem[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(false);

    // Form states for creating a new occurrence
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formTagline, setFormTagline] = useState("");
    const [formIntensity, setFormIntensity] = useState("A");
    const [formIsSpecial, setFormIsSpecial] = useState(false);
    const [formInstructorId, setFormInstructorId] = useState("");
    const [formDate, setFormDate] = useState("");
    const [formTime, setFormTime] = useState("09:00");
    const [formDuration, setFormDuration] = useState(60);
    const [formCapacity, setFormCapacity] = useState(25);
    const [formError, setFormError] = useState("");
    const [submittingAdd, setSubmittingAdd] = useState(false);
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);

    // Edit states inside details sheet
    const [editCapacity, setEditCapacity] = useState(25);
    const [editInstructorId, setEditInstructorId] = useState("");
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editTagline, setEditTagline] = useState("");
    const [editIntensity, setEditIntensity] = useState("A");
    const [editIsSpecial, setEditIsSpecial] = useState(false);
    const [submittingEdit, setSubmittingEdit] = useState(false);

    // Import / export
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    // Compute the week start (Monday) based on currentDate
    const weekStart = startOfWeek(toZonedTime(currentDate, STUDIO_TZ), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const loadCalendarData = useCallback(async () => {
        setLoading(true);
        try {
            const localWeekStart = startOfWeek(toZonedTime(currentDate, STUDIO_TZ), { weekStartsOn: 1 });
            const startStr = localWeekStart.toISOString();
            const endStr = addDays(localWeekStart, 7).toISOString();
            const res = await fetch(`/api/admin/calendar?start=${startStr}&end=${endStr}`);
            if (res.ok) {
                const data = await res.json();
                setOccurrences(data.occurrences);
                setInstructors(data.instructors);
            }
        } catch (error) {
            console.error("Failed to load calendar data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        loadCalendarData();
    }, [loadCalendarData]);

    // Derive unique class names for autocomplete from existing occurrences
    const classNameSuggestions = Array.from(
        new Map(occurrences.map((o) => [o.name, o])).values(),
    );

    const applyClassSuggestion = (name: string) => {
        const match = classNameSuggestions.find((o) => o.name === name);
        setFormName(name);
        if (match) {
            setFormDescription(match.description);
            setFormTagline(match.tagline);
            setFormIntensity(match.intensity);
            setFormIsSpecial(match.isSpecial);
            setFormDuration(match.durationMin);
        }
        setShowNameSuggestions(false);
    };

    // Load roster when an occurrence is clicked
    const handleOccurrenceClick = async (occ: Occurrence) => {
        setSelectedOcc(occ);
        setEditCapacity(occ.capacity);
        setEditInstructorId(occ.instructor.id);
        setEditName(occ.name);
        setEditDescription(occ.description);
        setEditTagline(occ.tagline);
        setEditIntensity(occ.intensity);
        setEditIsSpecial(occ.isSpecial);
        setLoadingRoster(true);
        setRoster([]);

        try {
            const res = await fetch(`/api/admin/classes/${occ.id}/roster`);
            if (res.ok) {
                const data = await res.json();
                setRoster(data.roster);
            }
        } catch (err) {
            console.error("Failed to load roster:", err);
        } finally {
            setLoadingRoster(false);
        }
    };

    // Submit new occurrence creation
    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        if (!formName.trim() || !formInstructorId || !formDate || !formTime) {
            setFormError("Class name, instructor, date, and time are required.");
            return;
        }

        setSubmittingAdd(true);
        try {
            const startsAt = new Date(`${formDate}T${formTime}:00`).toISOString();
            const res = await fetch("/api/admin/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName.trim(),
                    description: formDescription.trim(),
                    tagline: formTagline.trim(),
                    intensity: formIntensity,
                    isSpecial: formIsSpecial,
                    instructorId: formInstructorId,
                    startsAt,
                    durationMin: formDuration,
                    capacity: formCapacity,
                }),
            });

            if (res.ok) {
                setAddSheetOpen(false);
                // Clear form
                setFormName("");
                setFormDescription("");
                setFormTagline("");
                setFormIntensity("A");
                setFormIsSpecial(false);
                setFormInstructorId("");
                setFormDate("");
                setFormTime("09:00");
                setFormDuration(60);
                setFormCapacity(25);
                loadCalendarData();
            } else {
                const data = await res.json();
                setFormError(data.error || "Failed to schedule class session.");
            }
        } catch (err) {
            console.error("Failed to schedule class:", err);
            setFormError("Network error. Please try again.");
        } finally {
            setSubmittingAdd(false);
        }
    };

    // Save edited class occurrence (capacity, instructor, and inline metadata)
    const handleSaveEdit = async () => {
        if (!selectedOcc) return;
        setSubmittingEdit(true);
        try {
            const res = await fetch(`/api/admin/classes/${selectedOcc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim(),
                    tagline: editTagline.trim(),
                    intensity: editIntensity,
                    isSpecial: editIsSpecial,
                    capacity: editCapacity,
                    instructorId: editInstructorId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedOcc(data.occurrence);
                loadCalendarData();
                alert("Class updated successfully.");
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update class details.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmittingEdit(false);
        }
    };

    // Cancel occurrence (refund bookings)
    const handleCancelClass = async () => {
        if (!selectedOcc) return;
        if (
            !confirm(
                `Are you absolutely sure you want to CANCEL this class? \n\nAll ${selectedOcc.bookedCount} booked members will be automatically refunded their class credits, and their bookings will be cancelled. This cannot be undone.`,
            )
        ) {
            return;
        }

        setSubmittingEdit(true);
        try {
            const res = await fetch(`/api/admin/classes/${selectedOcc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CANCEL" }),
            });

            if (res.ok) {
                alert("Class has been cancelled and bookings have been refunded.");
                setSelectedOcc(null);
                loadCalendarData();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to cancel class.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmittingEdit(false);
        }
    };

    // Export helpers (export the full selected month)
    const buildExportRange = () => {
        const localMonthStart = startOfMonth(toZonedTime(currentDate, STUDIO_TZ));
        const localMonthEnd = endOfMonth(toZonedTime(currentDate, STUDIO_TZ));
        const startStr = localMonthStart.toISOString();
        const endStr = localMonthEnd.toISOString();
        return { startStr, endStr };
    };

    const handleExportCsv = () => {
        const { startStr, endStr } = buildExportRange();
        window.open(`/api/admin/classes/export/csv?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`, "_blank");
    };

    const handleExportXlsx = () => {
        const { startStr, endStr } = buildExportRange();
        window.open(`/api/admin/classes/export/xlsx?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`, "_blank");
    };

    const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/classes/import/csv", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                const newInstructorsNote =
                    Array.isArray(data.newInstructors) && data.newInstructors.length > 0
                        ? `\n\nNew instructors added: ${data.newInstructors.join(", ")}`
                        : "";
                alert(`Imported ${data.importedCount} class sessions.${newInstructorsNote}`);
                loadCalendarData();
            } else if (Array.isArray(data.details) && data.details.length > 0) {
                alert(`${data.error || "Validation failed"}:\n\n${data.details.join("\n")}`);
            } else {
                alert(data.error || "Import failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Import failed.");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Delete occurrence (allowed only if bookedCount === 0)
    const handleDeleteClass = async () => {
        if (!selectedOcc) return;
        if (!confirm("Are you sure you want to delete this empty class session completely?")) return;

        setSubmittingEdit(true);
        try {
            const res = await fetch(`/api/admin/classes/${selectedOcc.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert("Class session deleted.");
                setSelectedOcc(null);
                loadCalendarData();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete class.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmittingEdit(false);
        }
    };

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto h-full font-sans">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-display text-h1 font-semibold text-neutral-ink">
                        Schedule Calendar
                    </h1>
                    <p className="text-body-sm text-neutral-text-2">
                        Schedule new occurrences, change instructor capacity, or review booking rosters.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImportCsv}
                        className="hidden"
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Upload className="h-4 w-4" />}
                        onClick={() => fileInputRef.current?.click()}
                        loading={importing}
                        disabled={importing}
                    >
                        Import CSV
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={handleExportCsv}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                        onClick={handleExportXlsx}
                    >
                        Export XLSX
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="h-5 w-5" />}
                        onClick={() => setAddSheetOpen(true)}
                    >
                        Schedule Class
                    </Button>
                </div>
            </div>

            {/* Weekly Selector bar */}
            <div className="flex justify-between items-center bg-neutral-card border border-neutral-line rounded-md p-3.5 shadow-sm">
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentDate(addDays(currentDate, -7))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentDate(addDays(currentDate, 7))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 font-display text-body-lg font-bold text-neutral-ink">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    {format(weekStart, "d MMMM yyyy")} – {format(addDays(weekStart, 6), "d MMMM yyyy")}
                </div>
            </div>

            {/* Calendar Week Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1">
                {weekDays.map((day, idx) => {
                    const formattedDate = format(day, "yyyy-MM-dd");
                    const dayClasses = occurrences.filter((occ) => {
                        const localStartsAt = toZonedTime(parseISO(occ.startsAt), STUDIO_TZ);
                        return isSameDay(day, localStartsAt);
                    });

                    const isToday = isSameDay(day, toZonedTime(new Date(), STUDIO_TZ));

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col min-h-[350px] border border-neutral-line bg-neutral-card rounded-md shadow-sm overflow-hidden",
                                isToday && "border-2 border-primary-500 ring-2 ring-primary-100",
                            )}
                        >
                            {/* Day Header */}
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 border-b border-neutral-line text-center shrink-0",
                                    isToday ? "bg-primary-500 text-neutral-ink font-semibold" : "bg-neutral-bg",
                                )}
                            >
                                <span className="font-display text-overline uppercase tracking-[0.08em] opacity-80">
                                    {format(day, "EEE")}
                                </span>
                                <span className="font-display text-h2 font-bold mt-0.5">
                                    {format(day, "d")}
                                </span>
                            </div>

                            {/* Class occurrences under this day */}
                            <div className="flex-1 p-2.5 flex flex-col gap-2.5 overflow-y-auto bg-neutral-card/60">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-24 gap-2">
                                        <Loader className="h-5 w-5 animate-spin text-neutral-text-3" />
                                    </div>
                                ) : dayClasses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-24 text-center border-2 border-dashed border-neutral-line/40 rounded-sm">
                                        <p className="font-sans text-caption text-neutral-text-3 italic">
                                            No classes
                                        </p>
                                    </div>
                                ) : (
                                    dayClasses.map((occ) => {
                                        const dateStarts = parseISO(occ.startsAt);
                                        const localStarts = toZonedTime(dateStarts, STUDIO_TZ);
                                        const isSpecial = occ.isSpecial;

                                        return (
                                            <Card
                                                key={occ.id}
                                                interactive
                                                elevation="flat"
                                                onClick={() => handleOccurrenceClick(occ)}
                                                className={cn(
                                                    "p-3 flex flex-col gap-2 border border-neutral-line hover:border-primary-400 hover:bg-primary-50/50 rounded-sm transition-all duration-150 text-left cursor-pointer",
                                                    isSpecial && "border-l-4 border-l-primary-500 bg-primary-50/20",
                                                    occ.isCancelled && "opacity-50 hover:opacity-70 border-error-fg/40 bg-error-bg/20",
                                                )}
                                            >
                                                <div className="flex justify-between items-start gap-1">
                                                    <span
                                                        className={cn(
                                                            "font-display text-body-sm font-semibold tracking-wide text-neutral-ink leading-tight",
                                                            occ.isCancelled && "line-through",
                                                        )}
                                                    >
                                                        {occ.name}
                                                    </span>
                                                    {occ.isCancelled ? (
                                                        <Badge tone="error" className="shrink-0 text-[10px]">
                                                            Cancelled
                                                        </Badge>
                                                    ) : (
                                                        isSpecial && (
                                                            <Sparkles className="h-3.5 w-3.5 text-primary-600 shrink-0 mt-0.5" />
                                                        )
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1 text-neutral-text-3">
                                                    <div className="flex items-center gap-1.5 font-sans text-caption">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>{format(localStarts, "HH:mm")} ({occ.durationMin}m)</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1.5 font-sans text-caption mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3.5 w-3.5" />
                                                            <span className="font-medium">{occ.instructor.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-neutral-ink shrink-0 bg-neutral-line/30 px-1.5 py-0.5 rounded-sm">
                                                            <Users className="h-3 w-3 text-neutral-text-2" />
                                                            <span className="font-semibold text-[11px]">{occ.bookedCount}/{occ.capacity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SHEET 1: Add/Schedule Class Form */}
            <Sheet
                open={addSheetOpen}
                onClose={() => setAddSheetOpen(false)}
                title="Schedule Class Session"
            >
                <form onSubmit={handleAddSubmit} className="flex flex-col gap-5 mt-6 font-sans">
                    <p className="text-caption text-neutral-text-3 -mt-2">
                        Enter class details and schedule a session on the calendar. Existing class names autocomplete to speed things up.
                    </p>
                    {formError && (
                        <div className="flex gap-2.5 items-center p-3 rounded-sm bg-error-bg text-error-fg text-body-sm">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 relative">
                        <label className="text-caption font-medium text-neutral-text-2">Class Name</label>
                        <Input
                            required
                            type="text"
                            value={formName}
                            onChange={(e) => {
                                setFormName(e.target.value);
                                setShowNameSuggestions(true);
                            }}
                            onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                            onFocus={() => formName.trim().length >= 1 && setShowNameSuggestions(true)}
                            placeholder="e.g. Morning Vinyasa Flow"
                            autoComplete="off"
                        />
                        {showNameSuggestions && formName.trim().length >= 1 && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-20 bg-neutral-card border border-neutral-line rounded-md shadow-md max-h-40 overflow-y-auto">
                                {classNameSuggestions
                                    .filter((o) => o.name.toLowerCase().includes(formName.toLowerCase()))
                                    .map((o) => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                applyClassSuggestion(o.name);
                                            }}
                                            className="w-full text-left px-3 py-2 text-body-sm hover:bg-primary-50 focus:bg-primary-50"
                                        >
                                            {o.name}
                                        </button>
                                    ))}
                                {classNameSuggestions.filter((o) =>
                                    o.name.toLowerCase().includes(formName.toLowerCase()),
                                ).length === 0 && (
                                    <div className="px-3 py-2 text-caption text-neutral-text-3 italic">
                                        No existing class matches — create a new one.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Intensity</label>
                            <select
                                value={formIntensity}
                                onChange={(e) => setFormIntensity(e.target.value)}
                                className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                            >
                                {INTENSITIES.map((code) => (
                                    <option key={code} value={code}>
                                        {INTENSITY_LABELS[code]} ({code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <label className="flex flex-col gap-1.5 cursor-pointer select-none">
                            <span className="text-caption font-medium text-neutral-text-2">Special Workshop</span>
                            <span className="flex items-center gap-2 h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line">
                                <input
                                    type="checkbox"
                                    checked={formIsSpecial}
                                    onChange={(e) => setFormIsSpecial(e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-line text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-body-sm text-neutral-text-2">Mark as special masterclass</span>
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">Tagline</label>
                        <Input
                            type="text"
                            value={formTagline}
                            onChange={(e) => setFormTagline(e.target.value)}
                            placeholder="Short one-line hook"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">Description</label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            rows={3}
                            placeholder="Brief class description"
                            className="w-full px-3 py-2 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500 font-sans text-body-sm resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-caption font-medium text-neutral-text-2">Instructor</label>
                        <select
                            required
                            value={formInstructorId}
                            onChange={(e) => setFormInstructorId(e.target.value)}
                            className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                        >
                            <option value="">-- Choose Instructor --</option>
                            {instructors.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Date</label>
                            <Input
                                required
                                type="date"
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Start Time</label>
                            <Input
                                required
                                type="time"
                                value={formTime}
                                onChange={(e) => setFormTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Duration (minutes)</label>
                            <Input
                                required
                                type="number"
                                min={15}
                                max={300}
                                value={formDuration}
                                onChange={(e) => setFormDuration(parseInt(e.target.value, 10))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-caption font-medium text-neutral-text-2">Capacity</label>
                            <Input
                                required
                                type="number"
                                min={1}
                                max={100}
                                value={formCapacity}
                                onChange={(e) => setFormCapacity(parseInt(e.target.value, 10))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end border-t border-neutral-line pt-4 mt-4 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAddSheetOpen(false)}
                            disabled={submittingAdd}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={submittingAdd}
                            disabled={submittingAdd}
                        >
                            Schedule Session
                        </Button>
                    </div>
                </form>
            </Sheet>

            {/* SHEET 2: Class Occurrence Details & Bookings Roster */}
            <Sheet
                open={selectedOcc !== null}
                onClose={() => setSelectedOcc(null)}
                title={selectedOcc?.name ?? "Class Details"}
            >
                {selectedOcc && (
                    <div className="flex flex-col gap-6 mt-6 font-sans pb-4">
                        <p className="text-caption font-semibold text-primary-700 -mt-4 bg-primary-50/50 px-3 py-1.5 rounded-sm border border-primary-200">
                            🕒 {format(toZonedTime(parseISO(selectedOcc.startsAt), STUDIO_TZ), "EEEE, d MMMM yyyy · HH:mm")} ({selectedOcc.durationMin} min)
                        </p>
                        {/* Class details summary */}
                        <div className="bg-neutral-bg rounded-md p-4 border border-neutral-line flex flex-col gap-2">
                            <div className="flex gap-2">
                                {selectedOcc.isCancelled && (
                                    <Badge tone="error" className="text-caption font-medium">
                                        Cancelled
                                    </Badge>
                                )}
                                <Badge tone="neutral" className="text-caption font-medium">
                                    {INTENSITY_LABELS[selectedOcc.intensity as keyof typeof INTENSITY_LABELS] ?? selectedOcc.intensity} Intensity
                                </Badge>
                                {selectedOcc.isSpecial && (
                                    <Badge tone="primary" className="text-caption font-medium">
                                        Special Workshop
                                    </Badge>
                                )}
                            </div>
                            <p className="font-sans text-body-sm italic text-primary-700 font-medium">
                                &ldquo;{selectedOcc.tagline}&rdquo;
                            </p>
                            <p className="font-sans text-caption text-neutral-text-2 leading-relaxed">
                                {selectedOcc.description}
                            </p>
                        </div>

                        {/* Administrative Edit Form */}
                        <div className="flex flex-col gap-4 border-y border-neutral-line py-5">
                            <h3 className="font-display text-body font-semibold text-neutral-ink">
                                Edit Session Details
                            </h3>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-caption font-medium text-neutral-text-2">Class Name</label>
                                <Input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-caption font-medium text-neutral-text-2">Instructor</label>
                                    <select
                                        value={editInstructorId}
                                        onChange={(e) => setEditInstructorId(e.target.value)}
                                        className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                                    >
                                        {instructors.map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-caption font-medium text-neutral-text-2">Set Capacity</label>
                                    <Input
                                        type="number"
                                        min={Math.max(1, selectedOcc.bookedCount)} // Can't decrease capacity below currently booked
                                        value={editCapacity}
                                        onChange={(e) => setEditCapacity(parseInt(e.target.value, 10))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-caption font-medium text-neutral-text-2">Intensity</label>
                                    <select
                                        value={editIntensity}
                                        onChange={(e) => setEditIntensity(e.target.value)}
                                        className="w-full h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500"
                                    >
                                        {INTENSITIES.map((code) => (
                                            <option key={code} value={code}>
                                                {INTENSITY_LABELS[code]} ({code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex flex-col gap-1.5 cursor-pointer select-none">
                                    <span className="text-caption font-medium text-neutral-text-2">Special Workshop</span>
                                    <span className="flex items-center gap-2 h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line">
                                        <input
                                            type="checkbox"
                                            checked={editIsSpecial}
                                            onChange={(e) => setEditIsSpecial(e.target.checked)}
                                            className="h-4 w-4 rounded border-neutral-line text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-body-sm text-neutral-text-2">Mark as special masterclass</span>
                                    </span>
                                </label>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-caption font-medium text-neutral-text-2">Tagline</label>
                                <Input
                                    type="text"
                                    value={editTagline}
                                    onChange={(e) => setEditTagline(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-caption font-medium text-neutral-text-2">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500 font-sans text-body-sm resize-none"
                                />
                            </div>
                            <div className="flex justify-between items-center gap-3">
                                {selectedOcc.isCancelled ? (
                                    <span className="font-sans text-caption text-error-fg font-medium">
                                        This class session has been cancelled.
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        leftIcon={<AlertTriangle className="h-4 w-4" />}
                                        onClick={handleCancelClass}
                                        loading={submittingEdit}
                                        disabled={submittingEdit}
                                    >
                                        Cancel Class
                                    </Button>
                                )}

                                <div className="flex gap-2">
                                    {selectedOcc.bookedCount === 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeleteClass}
                                            disabled={submittingEdit}
                                        >
                                            <Trash2 className="h-4 w-4 text-neutral-text-3 hover:text-error-fg" />
                                        </Button>
                                    )}
                                    {!selectedOcc.isCancelled && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleSaveEdit}
                                            loading={submittingEdit}
                                            disabled={submittingEdit}
                                        >
                                            Save Changes
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bookings Roster */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-display text-body font-semibold text-neutral-ink flex items-center gap-2">
                                    Roster List <Badge tone="neutral">{selectedOcc.bookedCount} Booked</Badge>
                                </h3>
                            </div>

                            <div className="border border-neutral-line rounded-md bg-neutral-card overflow-hidden">
                                {loadingRoster ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 p-12">
                                        <Loader className="h-6 w-6 animate-spin text-neutral-text-3" />
                                        <span className="text-caption text-neutral-text-3">Loading class roster…</span>
                                    </div>
                                ) : roster.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 p-12 text-center">
                                        <Users className="h-8 w-8 text-neutral-line" />
                                        <p className="font-display text-body-sm font-semibold text-neutral-ink">Roster is empty</p>
                                        <p className="font-sans text-caption text-neutral-text-3 max-w-xs">
                                            No members have booked this class yet. Bookings will appear here in real-time.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-neutral-line">
                                        {roster.map((item, idx) => (
                                            <li key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                                                <div className="flex flex-col">
                                                    <span className="font-display text-body-sm font-semibold text-neutral-ink">
                                                        {idx + 1}. {item.member.displayName}
                                                    </span>
                                                    <span className="font-sans text-caption text-neutral-text-3">
                                                        📞 {item.member.phone} · ✉️ {item.member.email}
                                                    </span>
                                                </div>
                                                {item.checkedInAt ? (
                                                    <Badge tone="success">
                                                        In {format(toZonedTime(parseISO(item.checkedInAt), STUDIO_TZ), "HH:mm")}
                                                    </Badge>
                                                ) : (
                                                    <Badge tone="neutral">Booked</Badge>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Sheet>
        </div>
    );
}
