/**
 * Enforces the medical safety cap from the user's titanium-forearm-plate restriction.
 * This module is the single source of truth for the 25 kg limit so every caller (demo
 * mode, Supabase mode, manual overrides) goes through the same clamp.
 */
export const RIGHT_HAND_MAX_LOAD_KG = 25;
export const GOBLET_SUMO_TOTAL_MAX_KG = 25;

export interface SafetyCheckInput {
  loadBasis: "per_hand" | "total" | "machine_stack" | "bodyweight";
  proposedWeightKg: number;
  /** For unilateral exercises where only one arm is loaded, e.g. single-arm row. */
  involvesRightHand: boolean;
}

export interface SafetyCheckResult {
  allowedWeightKg: number;
  wasCapped: boolean;
  reason: string | null;
}

export function applySafetyCap(input: SafetyCheckInput): SafetyCheckResult {
  const { loadBasis, proposedWeightKg, involvesRightHand } = input;

  if (loadBasis === "per_hand" && involvesRightHand && proposedWeightKg > RIGHT_HAND_MAX_LOAD_KG) {
    return {
      allowedWeightKg: RIGHT_HAND_MAX_LOAD_KG,
      wasCapped: true,
      reason: `Capped at ${RIGHT_HAND_MAX_LOAD_KG} kg per hand due to the right-forearm restriction.`,
    };
  }

  if (loadBasis === "total" && proposedWeightKg > GOBLET_SUMO_TOTAL_MAX_KG) {
    return {
      allowedWeightKg: GOBLET_SUMO_TOTAL_MAX_KG,
      wasCapped: true,
      reason: `Capped at ${GOBLET_SUMO_TOTAL_MAX_KG} kg total (single dumbbell held with both hands) due to the right-forearm restriction.`,
    };
  }

  return { allowedWeightKg: proposedWeightKg, wasCapped: false, reason: null };
}

export type PainAction = "proceed" | "warn_substitute" | "stop_medical_review";

/** Pain-rating gate: 4+ warns/substitutes, 7+ stops the session recommendation entirely. */
export function evaluatePain(painScore: number): PainAction {
  if (painScore >= 7) return "stop_medical_review";
  if (painScore >= 4) return "warn_substitute";
  return "proceed";
}
