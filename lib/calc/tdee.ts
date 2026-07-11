import { ACTIVITY_MULTIPLIERS, type ActivityLevel } from "./types";

export function resolveActivityMultiplier(level: ActivityLevel, customMultiplier?: number | null): number {
  if (level === "custom") {
    if (!customMultiplier || customMultiplier < 1 || customMultiplier > 3) {
      throw new Error("customMultiplier must be provided between 1 and 3 when activityLevel is 'custom'");
    }
    return customMultiplier;
  }
  return ACTIVITY_MULTIPLIERS[level];
}

/** TDEE (maintenance calories) = BMR * activity multiplier. */
export function calculateTDEE(bmrKcal: number, activityLevel: ActivityLevel, customMultiplier?: number | null): number {
  const multiplier = resolveActivityMultiplier(activityLevel, customMultiplier);
  return Math.round(bmrKcal * multiplier);
}
