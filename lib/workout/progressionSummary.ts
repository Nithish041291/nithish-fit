import { calculateVolume } from "@/lib/calc/volume";
import type { ExerciseSet, WorkoutSession } from "@/lib/types";

export interface SessionHistoryEntry {
  session: WorkoutSession;
  sets: ExerciseSet[];
}

export interface ProgressionSummary {
  previousSession: SessionHistoryEntry | null;
  previousWeek: SessionHistoryEntry | null;
  fourWeekTrend: { date: string; volume: number; topWeightKg: number }[];
  bestWeightKg: number | null;
  bestReps: number | null;
  personalRecordSessionDate: string | null;
}

export function summarizeProgression(history: SessionHistoryEntry[], asOfDateIso: string): ProgressionSummary {
  const sorted = [...history].sort((a, b) => (a.session.date < b.session.date ? 1 : -1));
  const previousSession = sorted[0] ?? null;

  const weekAgo = new Date(asOfDateIso);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const previousWeek =
    sorted.find((h) => {
      const diff = Math.abs(new Date(h.session.date).getTime() - weekAgo.getTime());
      return diff < 3 * 86400000 && h.session.id !== previousSession?.session.id;
    }) ?? null;

  const fourWeeksAgo = new Date(asOfDateIso);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentWindow = sorted.filter((h) => new Date(h.session.date) >= fourWeeksAgo).sort((a, b) => (a.session.date < b.session.date ? -1 : 1));

  const fourWeekTrend = recentWindow.map((h) => ({
    date: h.session.date,
    volume: calculateVolume(h.sets.map((s) => ({ weightKg: s.actualWeightKg ?? 0, reps: s.actualReps ?? 0, completed: s.completed }))),
    topWeightKg: h.sets.reduce((m, s) => Math.max(m, s.actualWeightKg ?? 0), 0),
  }));

  let bestWeightKg: number | null = null;
  let bestReps: number | null = null;
  let personalRecordSessionDate: string | null = null;
  for (const h of sorted) {
    for (const s of h.sets) {
      if (!s.completed) continue;
      if (s.actualWeightKg !== null && (bestWeightKg === null || s.actualWeightKg > bestWeightKg)) {
        bestWeightKg = s.actualWeightKg;
        personalRecordSessionDate = h.session.date;
      }
      if (s.actualReps !== null && (bestReps === null || s.actualReps > bestReps)) {
        bestReps = s.actualReps;
      }
    }
  }

  return { previousSession, previousWeek, fourWeekTrend, bestWeightKg, bestReps, personalRecordSessionDate };
}
