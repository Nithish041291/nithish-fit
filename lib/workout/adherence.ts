import type { FoodLog, Weekday, WorkoutSession } from "@/lib/types";

export function startOfWeekIso(asOfIso: string): string {
  const date = new Date(asOfIso + "T00:00:00");
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

function weekdaysUpTo(trainingDays: Weekday[], weekStartIso: string, asOfIso: string): number {
  const order: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const start = new Date(weekStartIso + "T00:00:00");
  const asOf = new Date(asOfIso + "T00:00:00");
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > asOf) break;
    if (trainingDays.includes(order[d.getDay() === 0 ? 6 : d.getDay() - 1])) count++;
  }
  return count;
}

/** Share of this week's training days (so far) that have a completed session. */
export function calculateWorkoutCompletionPercent(trainingDays: Weekday[], sessions: WorkoutSession[], asOfIso: string): number {
  const weekStart = startOfWeekIso(asOfIso);
  const expectedSoFar = weekdaysUpTo(trainingDays, weekStart, asOfIso);
  if (expectedSoFar === 0) return 100;
  const completedThisWeek = sessions.filter((s) => s.date >= weekStart && s.date <= asOfIso && s.status === "completed").length;
  return Math.round(Math.min(1, completedThisWeek / expectedSoFar) * 100);
}

/** Share of this week's days (so far) whose logged calories land within +/-15% of target. */
export function calculateNutritionAdherencePercent(foodLogs: FoodLog[], calorieTarget: number, asOfIso: string): number {
  const weekStart = startOfWeekIso(asOfIso);
  const days: string[] = [];
  const start = new Date(weekStart + "T00:00:00");
  const asOf = new Date(asOfIso + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > asOf) break;
    days.push(d.toISOString().slice(0, 10));
  }
  if (days.length === 0 || calorieTarget <= 0) return 0;
  let onTarget = 0;
  for (const day of days) {
    const total = foodLogs.filter((f) => f.date === day).reduce((sum, f) => sum + f.calories, 0);
    if (total === 0) continue;
    const ratio = total / calorieTarget;
    if (ratio >= 0.85 && ratio <= 1.15) onTarget++;
  }
  return Math.round((onTarget / days.length) * 100);
}
