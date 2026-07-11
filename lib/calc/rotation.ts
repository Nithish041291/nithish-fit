import type { Exercise } from "@/lib/types";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Which numbered training block "now" falls in, given the programme's start date and cycle
 * length. Cycle 0 is the first block — rotation never applies until the programme has run for
 * at least one full `cycleWeeks` block.
 */
export function computeCycleIndex(startedOnIso: string, cycleWeeks: number, now: Date): number {
  const start = new Date(`${startedOnIso}T00:00:00Z`).getTime();
  const elapsedMs = now.getTime() - start;
  if (elapsedMs <= 0) return 0;
  const elapsedWeeks = Math.floor(elapsedMs / MS_PER_WEEK);
  return Math.floor(elapsedWeeks / Math.max(1, cycleWeeks));
}

export interface RotationLogEntry {
  workoutDayId: string;
  orderIndex: number;
  exerciseSlug: string;
  cycleIndex: number;
  rotatedAt: string;
}

export function slotKey(workoutDayId: string, orderIndex: number): string {
  return `${workoutDayId}:${orderIndex}`;
}

/**
 * Deterministic pseudo-random index in [0, length) derived from a string seed, so the same
 * training block always resolves to the same pick without needing extra "decision already made"
 * state beyond the rotation log itself.
 */
export function stableHashIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export interface RotationFilterContext {
  enabledEquipment: Set<string>;
}

export function isExerciseUsable(exercise: Exercise, ctx: RotationFilterContext): boolean {
  if (!exercise.isSelectableByDefault) return false;
  return exercise.equipment.every((eq) => ctx.enabledEquipment.has(eq));
}

/**
 * Builds the candidate pool for one exercise slot: the exercise's own curated substitutes
 * (coach-picked alternatives), broadened with every other exercise that trains the same primary
 * muscle via the same movement pattern so a thin curated list doesn't limit variety. Filters out
 * anything not usable with the user's currently enabled equipment, and anything trained recently
 * in this slot so a swap doesn't repeat back-to-back — falling back to the full usable set if
 * that leaves nothing (a small equipment set beats no rotation at all).
 */
export function buildCandidatePool(params: {
  anchor: Exercise;
  allExercises: Exercise[];
  recentSlugs: Set<string>;
  ctx: RotationFilterContext;
}): Exercise[] {
  const { anchor, allExercises, recentSlugs, ctx } = params;
  const exerciseBySlug = new Map(allExercises.map((e) => [e.slug, e]));
  const curated = anchor.substituteExerciseSlugs.map((s) => exerciseBySlug.get(s)).filter((e): e is Exercise => !!e);
  const broader = allExercises.filter(
    (e) => e.slug !== anchor.slug && e.primaryMuscles[0] === anchor.primaryMuscles[0] && e.movementPattern === anchor.movementPattern
  );
  const merged = [...curated, ...broader]
    .filter((e, idx, arr) => arr.findIndex((x) => x.slug === e.slug) === idx)
    .filter((e) => isExerciseUsable(e, ctx));

  const fresh = merged.filter((e) => !recentSlugs.has(e.slug));
  return fresh.length > 0 ? fresh : merged;
}

export function pickRotationCandidate(pool: Exercise[], seed: string): Exercise | null {
  if (pool.length === 0) return null;
  return pool[stableHashIndex(seed, pool.length)];
}
