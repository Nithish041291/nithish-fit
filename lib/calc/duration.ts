export interface DurationEstimateInput {
  exercises: { sets: number; restSeconds: number }[];
  /** Average time to actually perform one working set, in seconds. */
  secondsPerSet?: number;
  warmupMinutes?: number;
}

/** Heuristic workout-duration estimate: warm-up + (set time + rest) per set across all exercises. */
export function estimateWorkoutDurationMinutes(input: DurationEstimateInput): number {
  const secondsPerSet = input.secondsPerSet ?? 40;
  const warmupMinutes = input.warmupMinutes ?? 8;
  const workSeconds = input.exercises.reduce((total, ex) => total + ex.sets * (secondsPerSet + ex.restSeconds), 0);
  return Math.round(warmupMinutes + workSeconds / 60);
}
