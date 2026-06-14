// Level system from user-flow.md §10–11 + brand-guideline.md.
// Thresholds (from plan AC5): 20, 50, 100.
//
//   0–19   → CAT
//   20–49  → TIGER     (celebration at 20)
//   50–99  → LEOPARD   (celebration at 50)
//   100+   → LEOPARD ★ (celebration at 100 — "100 Club")

export type Level = "CAT" | "TIGER" | "LEOPARD";

export const LEVEL_THRESHOLDS = [
  { at: 0, level: "CAT" as const, label: "Cat" },
  { at: 20, level: "TIGER" as const, label: "Tiger" },
  { at: 50, level: "LEOPARD" as const, label: "Leopard" },
  { at: 100, level: "LEOPARD" as const, label: "Leopard ★ 100 Club" },
];

/** Thresholds that should trigger a one-time celebration toast. */
export const CELEBRATION_THRESHOLDS = [20, 50, 100] as const;

export interface LevelInfo {
  level: Level;
  label: string;
  /** True once classesAttended ≥ 100. */
  isCentury: boolean;
  /** 0-based index into LEVEL_THRESHOLDS for the current band. */
  index: number;
  /** Next milestone above the current one, or null if at 100+. */
  next: { at: number; level: Level; label: string } | null;
  /** Progress within the current band, 0..1. */
  progress: number;
  /** Classes left until the next milestone, or 0 if at 100+. */
  remaining: number;
}

export function getLevel(classesAttended: number): LevelInfo {
  const safe = Math.max(0, Math.floor(classesAttended));

  let index = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safe >= LEVEL_THRESHOLDS[i].at) {
      index = i;
      break;
    }
  }
  const current = LEVEL_THRESHOLDS[index];
  const next = LEVEL_THRESHOLDS[index + 1] ?? null;

  if (!next) {
    return {
      level: current.level,
      label: current.label,
      isCentury: true,
      index,
      next: null,
      progress: 1,
      remaining: 0,
    };
  }

  const bandSize = next.at - current.at;
  const inBand = safe - current.at;
  return {
    level: current.level,
    label: current.label,
    isCentury: safe >= 100,
    index,
    next,
    progress: bandSize > 0 ? Math.min(1, inBand / bandSize) : 1,
    remaining: Math.max(0, next.at - safe),
  };
}

/**
 * Given the previous attended count and the new count, return any thresholds
 * that were just crossed and should be celebrated.
 */
export function newlyCrossedThresholds(
  previous: number,
  next: number,
): number[] {
  return CELEBRATION_THRESHOLDS.filter((t) => previous < t && next >= t);
}
