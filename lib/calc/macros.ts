import { calculateTDEE } from "./tdee";
import type { ActivityLevel } from "./types";

export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;

export interface MacroTargetInput {
  bmrKcal: number;
  activityLevel: ActivityLevel;
  customActivityMultiplier?: number | null;
  /** Fat-loss deficit as a percentage of maintenance calories, e.g. 17.5 for 17.5%. */
  deficitPercent: number;
  currentWeightKg: number;
  targetWeightKg: number;
  proteinGPerKgCurrentWeight: number;
  fatGPerKgTargetWeight: number;
  fibreTargetG: number;
}

export interface MacroTargetResult {
  maintenanceKcal: number;
  calorieTargetKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  fibreG: number;
  proteinKcal: number;
  fatKcal: number;
  carbKcal: number;
}

/**
 * Full macro-target calculation: TDEE -> deficit -> calorie target, protein from current
 * weight, fat from target weight, fibre fixed, carbs = remaining calories (floored at 0).
 */
export function calculateMacroTargets(input: MacroTargetInput): MacroTargetResult {
  const maintenanceKcal = calculateTDEE(input.bmrKcal, input.activityLevel, input.customActivityMultiplier);
  const calorieTargetKcal = Math.round(maintenanceKcal * (1 - input.deficitPercent / 100));

  const proteinG = Math.round(input.currentWeightKg * input.proteinGPerKgCurrentWeight);
  const fatG = Math.round(input.targetWeightKg * input.fatGPerKgTargetWeight);
  const fibreG = Math.round(input.fibreTargetG);

  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const remainingKcal = Math.max(0, calorieTargetKcal - proteinKcal - fatKcal);
  const carbG = Math.round(remainingKcal / KCAL_PER_G_CARB);
  const carbKcal = carbG * KCAL_PER_G_CARB;

  return {
    maintenanceKcal,
    calorieTargetKcal,
    proteinG,
    fatG,
    carbG,
    fibreG,
    proteinKcal,
    fatKcal,
    carbKcal,
  };
}
