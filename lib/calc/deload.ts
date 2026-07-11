export interface DeloadCheckInput {
  weeksSinceLastDeload: number;
  consecutiveWeeksPerformanceDecline: number;
  /** Average wrist/forearm pain (0-10) over the last ~2 weeks of sessions. */
  recentAvgPainScore: number;
  /** Average muscle soreness (1-5) over the last ~2 weeks. */
  recentAvgSoreness: number;
  /** Average session difficulty (1-10) over the last ~2 weeks. */
  recentAvgSessionDifficulty: number;
}

export interface DeloadCheckResult {
  recommended: boolean;
  reasonCodes: string[];
  reasonText: string;
}

const HARD_TRAINING_WEEKS_THRESHOLD = 6;
const CONSECUTIVE_DECLINE_THRESHOLD = 2;
const ELEVATED_PAIN_THRESHOLD = 4;
const ELEVATED_SORENESS_THRESHOLD = 4; // out of 5
const HIGH_DIFFICULTY_THRESHOLD = 8; // out of 10

export function evaluateDeloadNeed(input: DeloadCheckInput): DeloadCheckResult {
  const reasonCodes: string[] = [];

  if (input.weeksSinceLastDeload >= HARD_TRAINING_WEEKS_THRESHOLD) reasonCodes.push("six_to_eight_hard_weeks");
  if (input.consecutiveWeeksPerformanceDecline >= CONSECUTIVE_DECLINE_THRESHOLD) reasonCodes.push("performance_decline_two_weeks");
  if (input.recentAvgPainScore >= ELEVATED_PAIN_THRESHOLD) reasonCodes.push("elevated_pain");
  if (input.recentAvgSoreness >= ELEVATED_SORENESS_THRESHOLD) reasonCodes.push("elevated_soreness");
  if (input.recentAvgSessionDifficulty >= HIGH_DIFFICULTY_THRESHOLD) reasonCodes.push("sustained_high_difficulty");

  const recommended = reasonCodes.length > 0;
  return {
    recommended,
    reasonCodes,
    reasonText: recommended
      ? "A deload is recommended: " + reasonCodes.join(", ").replaceAll("_", " ") + "."
      : "No deload needed based on recent training data.",
  };
}

/** "Reduce working sets by approximately 40%" -> keep ~60% of the original set count. */
export function computeDeloadSets(originalSets: number): number {
  return Math.max(1, Math.round(originalSets * 0.6));
}
