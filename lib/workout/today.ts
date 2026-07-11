import type { PlannedExercise, WorkoutDay } from "@/lib/types";

export function resolveTodaysWorkoutDay(weekday: WorkoutDay["weekday"], workoutDays: WorkoutDay[]): WorkoutDay | null {
  return workoutDays.find((d) => d.weekday === weekday) ?? null;
}

export function sortPlannedExercises(exercises: PlannedExercise[]): PlannedExercise[] {
  return [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
}
