export type Sex = "male" | "female";

export type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "custom";

/** Standard activity multipliers used to derive TDEE from BMR. */
export const ACTIVITY_MULTIPLIERS: Record<Exclude<ActivityLevel, "custom">, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};
