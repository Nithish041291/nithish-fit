import { evaluateDeloadNeed, type DeloadCheckResult } from "@/lib/calc/deload";
import { daysBetween } from "@/lib/format";
import type { ReadinessEntry, WorkoutSession } from "@/lib/types";

/**
 * Approximates the deload inputs from session/readiness history:
 * - weeksSinceLastDeload: since the last session flagged isDeload, or since the earliest
 *   completed session if none.
 * - consecutiveWeeksPerformanceDecline: not tracked with a dedicated metric here — approximated
 *   as 2 when the last two completed sessions' average session_difficulty both exceed 7,
 *   otherwise 0 (a conservative proxy; the UI always shows the reason codes so this is
 *   transparent rather than a hidden heuristic).
 */
export function evaluateDeloadStatus(sessions: WorkoutSession[], readiness: ReadinessEntry[], asOfDateIso: string): DeloadCheckResult {
  const completed = sessions.filter((s) => s.status === "completed").sort((a, b) => (a.date < b.date ? 1 : -1));
  if (completed.length === 0) {
    return { recommended: false, reasonCodes: [], reasonText: "No training history yet." };
  }

  const lastDeload = completed.find((s) => s.isDeload);
  const referenceDate = lastDeload ? lastDeload.date : completed[completed.length - 1].date;
  const weeksSinceLastDeload = Math.max(0, daysBetween(referenceDate, asOfDateIso) / 7);

  const recentSessions = completed.slice(0, 4);
  const difficulties = recentSessions.map((s) => s.sessionDifficulty).filter((d): d is number => d !== null);
  const recentAvgSessionDifficulty = difficulties.length > 0 ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length : 0;

  const pains = recentSessions.map((s) => s.wristPainScore).filter((p): p is number => p !== null);
  const recentAvgPainScore = pains.length > 0 ? pains.reduce((a, b) => a + b, 0) / pains.length : 0;

  const recentReadiness = readiness.slice(0, 4);
  const soreness = recentReadiness.map((r) => r.muscleSoreness);
  const recentAvgSoreness = soreness.length > 0 ? soreness.reduce((a, b) => a + b, 0) / soreness.length : 0;

  const consecutiveWeeksPerformanceDecline = recentSessions.length >= 2 && recentSessions.slice(0, 2).every((s) => (s.sessionDifficulty ?? 0) >= 8) ? 2 : 0;

  return evaluateDeloadNeed({
    weeksSinceLastDeload,
    consecutiveWeeksPerformanceDecline,
    recentAvgPainScore,
    recentAvgSoreness,
    recentAvgSessionDifficulty,
  });
}
