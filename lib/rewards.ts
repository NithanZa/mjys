// Pure derivations from `classesAttended`. No DB, no localStorage —
// safe to call from anywhere (server or client).
//
// Backend pass will keep this file as the source of truth for the rules and
// add a server-side `awardForAttendance(member)` that persists to
// `MemberToyPart` / `MemberMilestone`.

import { MILESTONES, TOY_PARTS, type Milestone, type ToyPart } from "@/lib/mock/rewards";

export interface ToyPartStatus {
  part: ToyPart;
  earned: boolean;
}

export interface MilestoneStatus {
  milestone: Milestone;
  unlocked: boolean;
  /** 0..1 — progress towards unlock (or 1 if already unlocked). */
  progress: number;
  /** Classes still needed; 0 if unlocked. */
  remaining: number;
}

export function getToyPartStatuses(classesAttended: number): ToyPartStatus[] {
  const safe = Math.max(0, Math.floor(classesAttended));
  return [...TOY_PARTS]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((part) => ({ part, earned: safe >= part.earnAt }));
}

export function countEarnedParts(classesAttended: number): number {
  return getToyPartStatuses(classesAttended).filter((p) => p.earned).length;
}

export function getMilestoneStatuses(classesAttended: number): MilestoneStatus[] {
  const safe = Math.max(0, Math.floor(classesAttended));
  return [...MILESTONES]
    .sort((a, b) => a.classesRequired - b.classesRequired)
    .map((milestone) => {
      const unlocked = safe >= milestone.classesRequired;
      return {
        milestone,
        unlocked,
        progress: unlocked
          ? 1
          : Math.min(1, safe / Math.max(1, milestone.classesRequired)),
        remaining: Math.max(0, milestone.classesRequired - safe),
      };
    });
}

/** Codes of milestones that are unlocked but not yet shown to the user. */
export function getUnseenUnlockedMilestones(
  classesAttended: number,
  seenCodes: string[],
): Milestone[] {
  const seen = new Set(seenCodes);
  return getMilestoneStatuses(classesAttended)
    .filter((s) => s.unlocked && !seen.has(s.milestone.code))
    .map((s) => s.milestone);
}
