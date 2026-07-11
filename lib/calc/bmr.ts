import type { Sex } from "./types";

/**
 * Mifflin-St Jeor BMR (kcal/day).
 * Men:   10 * weightKg + 6.25 * heightCm - 5 * age + 5
 * Women: 10 * weightKg + 6.25 * heightCm - 5 * age - 161
 */
export function calculateBMR(params: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;
  return Math.round(bmr);
}
