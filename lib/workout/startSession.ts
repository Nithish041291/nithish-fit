import { generateId } from "@/lib/calc/id";
import type { DataProvider } from "@/lib/data/provider";
import type { WorkoutDay } from "@/lib/types";
import { evaluateDeloadStatus } from "./deloadStatus";
import { buildSuggestion, type ExerciseHistoryEntry } from "./suggestion";

export async function startWorkoutSession(params: {
  provider: DataProvider;
  userId: string;
  workoutDay: WorkoutDay | null;
  label: string;
  date: string;
  readinessEntryId: string | null;
}): Promise<string> {
  const { provider, userId, workoutDay, label, date, readinessEntryId } = params;

  const [programme, increments, allSessions] = await Promise.all([
    provider.getActiveProgramme(),
    provider.listAvailableWeightIncrements(),
    provider.listSessions(),
  ]);

  // Readiness history isn't range-queryable via DataProvider yet (only the latest entry
  // is), so deload evaluation currently falls back to session-only signals — see
  // evaluateDeloadStatus's own fallback heuristics for session_difficulty/wristPainScore.
  const deloadStatus = evaluateDeloadStatus(allSessions, [], date);

  const session = await provider.saveSession({
    id: generateId(),
    userId,
    programmeId: programme?.id ?? null,
    workoutDayId: workoutDay?.id ?? null,
    label,
    date,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "in_progress",
    readinessEntryId,
    sessionDifficulty: null,
    wristPainScore: null,
    notes: "",
    isDeload: deloadStatus.recommended,
    durationMinutes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const plannedExercises = workoutDay ? await provider.listPlannedExercises(workoutDay.id) : [];

  for (const [index, planned] of plannedExercises.entries()) {
    const exercise = await provider.getExercise(planned.exerciseSlug);

    let suggestedWeight: number | null = null;
    let suggestedReps: number = planned.targetRepsLow;
    let coachingNote: string | undefined;

    if (exercise) {
      const historyRaw = await provider.listSetsForExercise(exercise.slug);
      const history: ExerciseHistoryEntry[] = historyRaw
        .filter((h) => h.session.date < date)
        .map((h) => ({ session: h.session, sets: h.sets }));
      const suggestion = buildSuggestion({ exercise, history, increments, asOfDateIso: date, isDeloadActive: deloadStatus.recommended });
      suggestedWeight = suggestion.recommendedWeightKg;
      suggestedReps = suggestion.recommendedRepsHigh;
      coachingNote = suggestion.reasonText;
    }

    const performance = await provider.savePerformance({
      id: generateId(),
      sessionId: session.id,
      exerciseSlug: planned.exerciseSlug,
      orderIndex: index,
      wasSkipped: false,
      wasReplacedBySlug: null,
      wasAddedExtra: false,
      note: coachingNote,
    });

    const setCount = deloadStatus.recommended ? Math.max(1, Math.round(planned.targetSets * 0.6)) : planned.targetSets;
    for (let setNumber = 1; setNumber <= setCount; setNumber++) {
      await provider.saveSet({
        id: generateId(),
        performanceId: performance.id,
        setNumber,
        suggestedWeightKg: suggestedWeight,
        actualWeightKg: null,
        suggestedReps,
        actualReps: null,
        rir: null,
        painScore: null,
        completed: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return session.id;
}
