import type { DataProvider } from "@/lib/data/provider";
import { buildCandidatePool, computeCycleIndex, pickRotationCandidate, slotKey, type RotationLogEntry } from "@/lib/calc/rotation";
import type { EquipmentType, Exercise } from "@/lib/types";

const ROTATION_LOG_SETTING_KEY = "exerciseRotationLog";
const RECENT_CYCLES_TO_AVOID = 2;
const LOG_RETENTION_CYCLES = 6;

export interface RotationChange {
  dayLabel: string;
  fromName: string;
  toName: string;
}

function parseLog(raw: string | null): RotationLogEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RotationLogEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Runs once per training block (per `programme.cycleWeeks`) to swap each planned exercise for a
 * fresh, equally-safe alternative — same primary muscle and movement pattern, respecting enabled
 * equipment and avoiding whatever this slot used in the last couple of cycles — so the same 6-7
 * exercises aren't repeated unchanged for months. Idempotent: re-running within the same cycle
 * for a slot that's already been decided is a no-op, tracked via a rotation log stored through
 * `getSetting`/`setSetting` (no schema change needed).
 */
export async function applyExerciseRotation(provider: DataProvider): Promise<RotationChange[]> {
  const programme = await provider.getActiveProgramme();
  if (!programme) return [];

  const cycleIndex = computeCycleIndex(programme.startedOn, programme.cycleWeeks, new Date());
  if (cycleIndex === 0) return [];

  const [days, allExercises, userEquipment, equipmentCatalog, rawLog] = await Promise.all([
    provider.listWorkoutDays(programme.id),
    provider.listExercises(),
    provider.listUserEquipment(),
    provider.listEquipment(),
    provider.getSetting(ROTATION_LOG_SETTING_KEY),
  ]);

  const equipmentTypeById = new Map(equipmentCatalog.map((e) => [e.id, e.type]));
  const enabledEquipment = new Set<string>(
    userEquipment
      .filter((ue) => ue.enabled)
      .map((ue) => equipmentTypeById.get(ue.equipmentId))
      .filter((t): t is EquipmentType => !!t)
  );
  const exerciseBySlug = new Map<string, Exercise>(allExercises.map((e) => [e.slug, e]));
  const log = parseLog(rawLog);
  const newEntries: RotationLogEntry[] = [];
  const changes: RotationChange[] = [];

  for (const day of days) {
    if (day.isRestDay) continue;
    const planned = await provider.listPlannedExercises(day.id);
    for (const pe of planned) {
      const key = slotKey(day.id, pe.orderIndex);
      const alreadyDecidedThisCycle = log.some((l) => slotKey(l.workoutDayId, l.orderIndex) === key && l.cycleIndex === cycleIndex);
      if (alreadyDecidedThisCycle) continue;

      const anchor = exerciseBySlug.get(pe.exerciseSlug);
      if (!anchor) continue;

      const recentSlugs = new Set(
        log
          .filter(
            (l) =>
              slotKey(l.workoutDayId, l.orderIndex) === key && l.cycleIndex < cycleIndex && l.cycleIndex >= cycleIndex - RECENT_CYCLES_TO_AVOID
          )
          .map((l) => l.exerciseSlug)
      );
      recentSlugs.add(pe.exerciseSlug);

      const pool = buildCandidatePool({ anchor, allExercises, recentSlugs, ctx: { enabledEquipment } });
      const pick = pickRotationCandidate(pool, `${key}:${cycleIndex}`);
      if (!pick) continue;

      newEntries.push({ workoutDayId: day.id, orderIndex: pe.orderIndex, exerciseSlug: pick.slug, cycleIndex, rotatedAt: new Date().toISOString() });

      if (pick.slug !== pe.exerciseSlug) {
        await provider.savePlannedExercise({
          ...pe,
          exerciseSlug: pick.slug,
          targetRepsLow: pick.suggestedRepRangeLow,
          targetRepsHigh: pick.suggestedRepRangeHigh,
          notes: pick.perHandOrTotalNote || pe.notes,
        });
        changes.push({ dayLabel: day.label, fromName: anchor.name, toName: pick.name });
      }
    }
  }

  if (newEntries.length > 0) {
    const merged = [...log, ...newEntries].filter((l) => l.cycleIndex >= cycleIndex - LOG_RETENTION_CYCLES);
    await provider.setSetting(ROTATION_LOG_SETTING_KEY, JSON.stringify(merged));
  }

  return changes;
}
