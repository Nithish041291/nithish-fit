import { applySafetyCap } from "./safety";

export interface CompletedSetResult {
  weightKg: number;
  reps: number;
  rir: number | null;
  painScore: number | null;
  completed: boolean;
}

export interface ProgressionExerciseContext {
  loadBasis: "per_hand" | "total" | "machine_stack" | "bodyweight";
  involvesRightHand: boolean;
  /** Hard ceiling from the exercise directory (e.g. 25 for restricted dumbbell moves). */
  perHandOrTotalWeightLimitKg: number | null;
  repRangeLow: number;
  repRangeHigh: number;
  /** Smallest increment this equipment can move by (e.g. 2 kg for adjustable dumbbells). */
  availableIncrementKg: number;
  wristLoadCategory: "low" | "moderate" | "high";
}

export interface ProgressionInput {
  exercise: ProgressionExerciseContext;
  lastSessionSets: CompletedSetResult[] | null;
  /** Days since this exercise was last trained (null if never trained before). */
  daysSinceLastSession: number | null;
  isDeloadActive: boolean;
}

export type ProgressionAction =
  | "increase_load"
  | "increase_reps"
  | "maintain_load"
  | "reduce_load"
  | "break_reintroduction"
  | "deload"
  | "no_history";

export interface ProgressionResult {
  action: ProgressionAction;
  recommendedWeightKg: number | null;
  recommendedRepsLow: number;
  recommendedRepsHigh: number;
  cappedBySafetyLimit: boolean;
  suggestSwitchToMachine: boolean;
  reasonCodes: string[];
  reasonText: string;
}

const BREAK_THRESHOLD_DAYS = 10;
const BREAK_REINTRODUCTION_FACTOR = 0.65; // midpoint of the 60-70% guidance
const REDUCE_LOAD_FACTOR = 0.925; // midpoint of the 5-10% guidance
const DELOAD_LOAD_FACTOR = 0.85; // midpoint of the 10-20% guidance

function roundToIncrement(weightKg: number, incrementKg: number): number {
  return Math.round(weightKg / incrementKg) * incrementKg;
}

function capWeight(exercise: ProgressionExerciseContext, weightKg: number) {
  const safety = applySafetyCap({
    loadBasis: exercise.loadBasis,
    proposedWeightKg: weightKg,
    involvesRightHand: exercise.involvesRightHand,
  });
  let allowed = safety.allowedWeightKg;
  if (exercise.perHandOrTotalWeightLimitKg !== null) {
    allowed = Math.min(allowed, exercise.perHandOrTotalWeightLimitKg);
  }
  return { allowedWeightKg: allowed, wasCapped: safety.wasCapped || allowed < weightKg };
}

/**
 * Rule-based progressive-overload recommendation. Every branch returns explicit reason
 * codes so the UI can always explain *why* — see spec section 10.
 */
export function recommendProgression(input: ProgressionInput): ProgressionResult {
  const { exercise, lastSessionSets, daysSinceLastSession, isDeloadActive } = input;

  if (isDeloadActive) {
    const lastWeight = lastSessionSets?.[0]?.weightKg ?? null;
    const recommendedWeightKg =
      lastWeight !== null
        ? roundToIncrement(capWeight(exercise, lastWeight * DELOAD_LOAD_FACTOR).allowedWeightKg, exercise.availableIncrementKg)
        : null;
    return {
      action: "deload",
      recommendedWeightKg,
      recommendedRepsLow: exercise.repRangeLow,
      recommendedRepsHigh: exercise.repRangeHigh,
      cappedBySafetyLimit: false,
      suggestSwitchToMachine: false,
      reasonCodes: ["deload_active"],
      reasonText: `Deload week: load reduced by roughly 15% and sets reduced by roughly 40%. Continue only pain-free exercises.`,
    };
  }

  if (!lastSessionSets || lastSessionSets.length === 0) {
    return {
      action: "no_history",
      recommendedWeightKg: null,
      recommendedRepsLow: exercise.repRangeLow,
      recommendedRepsHigh: exercise.repRangeHigh,
      cappedBySafetyLimit: false,
      suggestSwitchToMachine: false,
      reasonCodes: ["no_history"],
      reasonText: "No previous session recorded for this exercise yet. Start conservatively and record actuals.",
    };
  }

  const lastWeight = lastSessionSets[0].weightKg;
  const maxPain = Math.max(0, ...lastSessionSets.map((s) => s.painScore ?? 0));

  // Break re-introduction takes priority over performance-based rules.
  if (daysSinceLastSession !== null && daysSinceLastSession >= BREAK_THRESHOLD_DAYS) {
    const target = capWeight(exercise, lastWeight * BREAK_REINTRODUCTION_FACTOR);
    return {
      action: "break_reintroduction",
      recommendedWeightKg: roundToIncrement(target.allowedWeightKg, exercise.availableIncrementKg),
      recommendedRepsLow: exercise.repRangeLow,
      recommendedRepsHigh: exercise.repRangeHigh,
      cappedBySafetyLimit: target.wasCapped,
      suggestSwitchToMachine: false,
      reasonCodes: ["break_10_days_plus"],
      reasonText: `It has been ${daysSinceLastSession} days since this exercise was last trained. Recommending roughly 65% of the previous working weight to reintroduce load safely — this is not performance regression.`,
    };
  }

  // Pain gate: never increase load when pain was reported. 4+ recommends a substitute.
  if (maxPain >= 4) {
    const target = capWeight(exercise, lastWeight * REDUCE_LOAD_FACTOR);
    return {
      action: "reduce_load",
      recommendedWeightKg: roundToIncrement(target.allowedWeightKg, exercise.availableIncrementKg),
      recommendedRepsLow: exercise.repRangeLow,
      recommendedRepsHigh: exercise.repRangeHigh,
      cappedBySafetyLimit: target.wasCapped,
      suggestSwitchToMachine: exercise.wristLoadCategory !== "low",
      reasonCodes: ["pain_reported", maxPain >= 7 ? "pain_severe" : "pain_moderate"],
      reasonText:
        maxPain >= 7
          ? "Pain of 7/10 or higher was reported. Do not progress this exercise — seek medical review before continuing."
          : "Pain of 4/10 or higher was reported last session. Load has not been increased; consider a safer substitute.",
    };
  }

  const completedSets = lastSessionSets.filter((s) => s.completed);
  const incompleteCount = lastSessionSets.length - completedSets.length;
  const allHitTopOfRange = completedSets.length === lastSessionSets.length && completedSets.every((s) => s.reps >= exercise.repRangeHigh);
  const avgRir =
    completedSets.length > 0
      ? completedSets.reduce((sum, s) => sum + (s.rir ?? 0), 0) / completedSets.length
      : 0;
  const substantiallyBelowTarget = completedSets.some((s) => s.reps < exercise.repRangeLow - 1);

  // Successful progression.
  if (allHitTopOfRange && avgRir >= 2 && maxPain < 4) {
    const atCap = exercise.perHandOrTotalWeightLimitKg !== null && lastWeight >= exercise.perHandOrTotalWeightLimitKg;
    if (atCap) {
      return {
        action: "increase_reps",
        recommendedWeightKg: lastWeight,
        recommendedRepsLow: Math.min(exercise.repRangeHigh + 2, exercise.repRangeLow + 12),
        recommendedRepsHigh: exercise.repRangeHigh + 2,
        cappedBySafetyLimit: true,
        suggestSwitchToMachine: true,
        reasonCodes: ["weight_cap_reached", "progress_via_reps"],
        reasonText: `The ${exercise.perHandOrTotalWeightLimitKg} kg safety limit has been reached. Progress with 1-2 additional reps, slower eccentrics, or a machine/cable alternative instead of more load.`,
      };
    }
    const nextWeight = capWeight(exercise, lastWeight + exercise.availableIncrementKg);
    return {
      action: "increase_load",
      recommendedWeightKg: roundToIncrement(nextWeight.allowedWeightKg, exercise.availableIncrementKg),
      recommendedRepsLow: exercise.repRangeLow,
      recommendedRepsHigh: exercise.repRangeHigh,
      cappedBySafetyLimit: nextWeight.wasCapped,
      suggestSwitchToMachine: false,
      reasonCodes: ["top_of_range_hit", "rir_2_plus"],
      reasonText: `All sets reached the top of the rep range with 2+ reps in reserve and no pain. Increasing by the smallest available increment (${exercise.availableIncrementKg} kg).`,
    };
  }

  // Reduce load: substantial rep miss or multiple incomplete sets or technique concerns.
  if (substantiallyBelowTarget || incompleteCount > 1) {
    const target = capWeight(exercise, lastWeight * REDUCE_LOAD_FACTOR);
    return {
      action: "reduce_load",
      recommendedWeightKg: roundToIncrement(target.allowedWeightKg, exercise.availableIncrementKg),
      recommendedRepsLow: exercise.repRangeLow,
      recommendedRepsHigh: exercise.repRangeHigh,
      cappedBySafetyLimit: target.wasCapped,
      suggestSwitchToMachine: false,
      reasonCodes: ["reps_below_target", "incomplete_sets"],
      reasonText: "Repetitions fell substantially below target or more than one set was incomplete. Reducing load by roughly 7.5% to rebuild technique.",
    };
  }

  // Default: maintain load, focus on execution.
  return {
    action: "maintain_load",
    recommendedWeightKg: lastWeight,
    recommendedRepsLow: exercise.repRangeLow,
    recommendedRepsHigh: exercise.repRangeHigh,
    cappedBySafetyLimit: false,
    suggestSwitchToMachine: false,
    reasonCodes: avgRir < 2 ? ["low_rir"] : ["target_reps_uncertain_technique"],
    reasonText: "Target reps were achieved but with low reserve (RIR 0-1) or uncertain technique. Maintaining load — focus on hitting reps cleanly before adding weight.",
  };
}
