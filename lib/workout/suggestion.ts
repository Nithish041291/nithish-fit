import { recommendProgression, type ProgressionResult, type CompletedSetResult } from "@/lib/calc/progression";
import { daysBetween } from "@/lib/format";
import type { AvailableWeightIncrement, Exercise, ExerciseSet, WorkoutSession } from "@/lib/types";

export function resolveIncrementKg(exercise: Exercise, increments: AvailableWeightIncrement[]): number {
  for (const equipmentType of exercise.equipment) {
    const match = increments.find((i) => i.equipmentType === equipmentType);
    if (match) return match.incrementKg;
  }
  return exercise.equipment.includes("dumbbell") ? 2 : 5;
}

export interface ExerciseHistoryEntry {
  session: WorkoutSession;
  sets: ExerciseSet[];
}

export function buildSuggestion(params: {
  exercise: Exercise;
  history: ExerciseHistoryEntry[]; // newest first, completed sessions only
  increments: AvailableWeightIncrement[];
  asOfDateIso: string;
  isDeloadActive: boolean;
}): ProgressionResult {
  const { exercise, history, increments, asOfDateIso, isDeloadActive } = params;
  const last = history[0];

  const lastSessionSets: CompletedSetResult[] | null = last
    ? last.sets.map((s) => ({
        weightKg: s.actualWeightKg ?? s.suggestedWeightKg ?? 0,
        reps: s.actualReps ?? 0,
        rir: s.rir,
        painScore: s.painScore,
        completed: s.completed,
      }))
    : null;

  const daysSinceLastSession = last ? daysBetween(last.session.date, asOfDateIso) : null;
  const involvesRightHand = exercise.loadBasis === "per_hand" || exercise.loadBasis === "total";

  return recommendProgression({
    exercise: {
      loadBasis: exercise.loadBasis === "bodyweight" ? "bodyweight" : exercise.loadBasis,
      involvesRightHand,
      perHandOrTotalWeightLimitKg: exercise.perHandWeightLimitKg,
      repRangeLow: exercise.suggestedRepRangeLow,
      repRangeHigh: exercise.suggestedRepRangeHigh,
      availableIncrementKg: resolveIncrementKg(exercise, increments),
      wristLoadCategory: exercise.wristLoadCategory,
    },
    lastSessionSets,
    daysSinceLastSession,
    isDeloadActive,
  });
}
