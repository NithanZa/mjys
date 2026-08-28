"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button, Card, Badge, Sheet, Modal, Input, Avatar } from "@/components/ui";
import {
  Plus,
  Trash2,
  Loader,
  Upload,
  AlertTriangle,
  Pencil,
} from "lucide-react";

interface StaffMember {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  initials: string;
  order: number;
  _count?: { occurrences: number };
}

interface StaffEditTabProps {
  onLoading?: (loading: boolean) => void;
}

export function StaffEditTab({ onLoading }: StaffEditTabProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formInitials, setFormInitials] = useState("");
  const [formOrder, setFormOrder] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    onLoading?.(true);
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.instructors);
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }, [onLoading]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // --- Add / Edit ---

  function openAddSheet() {
    setEditingStaff(null);
    setFormName("");
    setFormTitle("");
    setFormBio("");
    setFormInitials("");
    setFormOrder("");
    setFormPhotoUrl(null);
    setFormError("");
    setSheetOpen(true);
  }

  function openEditSheet(member: StaffMember) {
    setEditingStaff(member);
    setFormName(member.name);
    setFormTitle(member.title);
    setFormBio(member.bio);
    setFormInitials(member.initials);
    setFormOrder(String(member.order));
    setFormPhotoUrl(member.photoUrl);
    setFormError("");
    setSheetOpen(true);
  }

  async function handleUploadAvatar(file: File) {
    setUploadingAvatar(true);
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/staff/upload-avatar", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFormPhotoUrl(data.url);
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to upload avatar.");
      }
    } catch {
      setFormError("Network error during upload.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit() {
    if (!formName || !formTitle || !formBio || !formInitials) {
      setFormError("Name, title, bio, and initials are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload: Record<string, unknown> = {
        name: formName,
        title: formTitle,
        bio: formBio,
        initials: formInitials,
        photoUrl: formPhotoUrl,
      };
      if (formOrder) {
        payload.order = parseInt(formOrder, 10);
      }

      if (editingStaff) {
        // Edit
        const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          setFormError(err.error || "Failed to update staff member.");
          return;
        }
      } else {
        // Create
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          setFormError(err.error || "Failed to create staff member.");
          return;
        }
      }

      setSheetOpen(false);
      loadStaff();
    } catch {
      setFormError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Delete ---

  function openDeleteModal(member: StaffMember) {
    setDeletingStaff(member);
    setDeleteWarning(null);
    setDeleteModalOpen(true);
  }

  async function handleDelete(confirm = false) {
    if (!deletingStaff) return;
    setDeleting(true);
    try {
      const url = `/api/admin/staff/${deletingStaff.id}${confirm ? "?confirm=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });

      if (res.status === 409) {
        const data = await res.json();
        setDeleteWarning(
          `This staff member has ${data.upcomingCount} upcoming scheduled class(es). Deleting them will also delete those class occurrences. Type confirm to proceed anyway.`,
        );
        setDeleting(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete staff member.");
      } else {
        setDeleteModalOpen(false);
        setDeletingStaff(null);
        setDeleteWarning(null);
        loadStaff();
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h2 font-semibold text-neutral-ink">
          Edit Staff
        </h2>
        <Button
          onClick={openAddSheet}
          leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
        >
          Add Staff
        </Button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-6 w-6 animate-spin text-primary-700" />
        </div>
      ) : staff.length === 0 ? (
        <Card elevation="sm" className="border border-neutral-line p-8 text-center">
          <p className="text-neutral-text-2">
            No staff members yet. Click &ldquo;Add Staff&rdquo; to create the first profile.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <Avatar
                  src={member.photoUrl}
                  alt={member.name}
                  fallback={member.initials}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-body-lg font-semibold text-neutral-ink truncate">
                    {member.name}
                  </p>
                  <p className="text-caption text-primary-600 truncate">
                    {member.title}
                  </p>
                  {member._count && member._count.occurrences > 0 && (
                    <Badge className="mt-1.5" tone="primary">
                      {member._count.occurrences} upcoming
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex border-t border-neutral-line">
                <button
                  onClick={() => openEditSheet(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-body-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-body-sm font-medium text-error-fg hover:bg-error-bg/20 transition-colors border-l border-neutral-line"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingStaff ? "Edit Staff Member" : "Add Staff Member"}
        height={85}
      >
        <div className="flex flex-col gap-4">
          {/* Avatar upload */}
          <div className="flex flex-col gap-2">
            <label className="text-caption font-medium text-neutral-text-2">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                src={formPhotoUrl}
                alt={formName || "New staff"}
                fallback={formInitials || "?"}
                size="xl"
              />
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadAvatar(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingAvatar}
                  leftIcon={!uploadingAvatar ? <Upload className="h-4 w-4" /> : undefined}
                >
                  {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                </Button>
                {formPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormPhotoUrl(null)}
                    className="text-caption text-error-fg hover:underline text-left"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-neutral-text-2">
              Name *
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Kru Nop"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-neutral-text-2">
              Title *
            </label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Founder · Lead Instructor"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-neutral-text-2">
              Initials *
            </label>
            <Input
              value={formInitials}
              onChange={(e) => setFormInitials(e.target.value)}
              placeholder="KN"
              maxLength={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-neutral-text-2">
              Bio *
            </label>
            <textarea
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              rows={4}
              placeholder="Brief biography..."
              className="w-full px-3 py-2 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500 font-sans text-body-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-neutral-text-2">
              Display Order
            </label>
            <Input
              type="number"
              value={formOrder}
              onChange={(e) => setFormOrder(e.target.value)}
              placeholder="Auto (next available)"
            />
          </div>

          {formError && (
            <p className="text-body-sm text-error-fg">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              loading={submitting}
              onClick={handleSubmit}
            >
              {editingStaff ? "Save Changes" : "Create Staff"}
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Delete Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteWarning(null);
          setDeletingStaff(null);
        }}
        title="Delete Staff Member"
      >
        <div className="flex flex-col gap-4">
          {deleteWarning ? (
            <div className="flex gap-2.5 p-3 rounded-sm bg-error-bg/30 border border-error-fg/30">
              <AlertTriangle className="h-5 w-5 shrink-0 text-error-fg" />
              <p className="text-body-sm text-error-fg">
                {deleteWarning}
              </p>
            </div>
          ) : (
            <p className="text-body-sm text-neutral-text-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-neutral-ink">
                {deletingStaff?.name}
              </span>
              ? This action cannot be undone.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteWarning(null);
                setDeletingStaff(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              fullWidth
              loading={deleting}
              onClick={() => handleDelete(deleteWarning !== null)}
            >
              {deleteWarning ? "Delete Anyway" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
