export interface ReadinessInput {
  sleepHours: number;
  energyLevel: number; // 1-5
  muscleSoreness: number; // 1-5
  wristPain: number; // 0-10
  stressLevel: number; // 1-5
}

export type ReadinessRecommendation =
  | "proceed_normally"
  | "keep_same_load"
  | "reduce_load_5_10_percent"
  | "reduce_one_set_per_exercise"
  | "recovery_session"
  | "stop_medical_review";

export interface ReadinessResult {
  recommendation: ReadinessRecommendation;
  reasonCodes: string[];
  reasonText: string;
}

/**
 * Conservative readiness scoring: a single low score never triggers a large programme
 * change. Only pain has a hard gate; everything else is a soft composite.
 */
export function evaluateReadiness(input: ReadinessInput): ReadinessResult {
  if (input.wristPain >= 7) {
    return {
      recommendation: "stop_medical_review",
      reasonCodes: ["pain_severe"],
      reasonText: "Wrist/forearm pain is 7/10 or higher. Stop and seek advice from a qualified doctor or physiotherapist before training.",
    };
  }
  if (input.wristPain >= 4) {
    return {
      recommendation: "reduce_load_5_10_percent",
      reasonCodes: ["pain_moderate"],
      reasonText: "Wrist/forearm pain is 4/10 or higher. Reduce load by roughly 5-10% and consider substituting the affected exercise.",
    };
  }

  const flags: string[] = [];
  if (input.energyLevel <= 2) flags.push("low_energy");
  if (input.muscleSoreness >= 4) flags.push("high_soreness");
  if (input.stressLevel >= 4) flags.push("high_stress");
  if (input.sleepHours < 5) flags.push("low_sleep");

  if (flags.length >= 3) {
    return {
      recommendation: "recovery_session",
      reasonCodes: flags,
      reasonText: "Multiple recovery signals are low today. Consider a lighter recovery session instead of the planned workout.",
    };
  }
  if (flags.length === 2) {
    return {
      recommendation: "reduce_one_set_per_exercise",
      reasonCodes: flags,
      reasonText: "A couple of recovery signals are low today. Consider dropping one set per exercise.",
    };
  }
  if (flags.length === 1) {
    return {
      recommendation: "keep_same_load",
      reasonCodes: flags,
      reasonText: "One recovery signal is slightly low today — not enough on its own to change the plan. Keep the same load and monitor.",
    };
  }
  return {
    recommendation: "proceed_normally",
    reasonCodes: [],
    reasonText: "Readiness looks normal. Proceed with the planned session.",
  };
}
