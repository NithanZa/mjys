// FRONTEND-ONLY synthesized class history.
//
// Real attendance won't exist until the backend pass wires the QR check-in
// route. To keep the UI populated for testing, we deterministically synthesize
// `classesAttended` past entries by rotating through the mock templates &
// instructors and back-dating each by ~3 days.
//
// Backend pass will replace this with a `GET /api/attendance?member=me` query.

import { subDays, subHours } from "date-fns";
import { CLASS_TEMPLATES, INSTRUCTORS, type ClassTemplate, type Instructor } from "@/lib/mock/schedule";

export type ActivityStatus = "ATTENDED" | "BOOKED" | "CANCELLED" | "NO_SHOW";

export interface ActivityItem {
  id: string;
  template: ClassTemplate;
  instructor: Instructor;
  occurredAt: Date;
  status: ActivityStatus;
}

const ROTATION_DAYS = 3;

export function getRecentActivity(classesAttended: number): ActivityItem[] {
  const safe = Math.max(0, Math.floor(classesAttended));
  if (safe === 0) return [];

  const items: ActivityItem[] = [];
  // Anchor the most recent entry to "yesterday at 18:30 studio time".
  const anchor = subHours(subDays(new Date(), 1), 1);

  for (let i = 0; i < safe; i++) {
    const template = CLASS_TEMPLATES[i % CLASS_TEMPLATES.length];
    const instructor = INSTRUCTORS[i % INSTRUCTORS.length];
    const occurredAt = subDays(anchor, i * ROTATION_DAYS);
    items.push({
      id: `activity_${i}`,
      template,
      instructor,
      occurredAt,
      status: "ATTENDED",
    });
  }
  // Newest first (i=0 is already newest by construction).
  return items;
}

export function getRecentActivityPreview(
  classesAttended: number,
  limit = 2,
): ActivityItem[] {
  return getRecentActivity(classesAttended).slice(0, limit);
}
