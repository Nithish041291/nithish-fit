import type { MealPlanPreference } from "@/lib/types";

/** Default meal-plan preferences derived from the seed profile (spec section 6H / 2). */
export const defaultMealPlanPreferences: MealPlanPreference = {
  style: "mixed_indian",
  mealsPerDay: 6,
  vegetarianDaysPerWeek: 0,
  eggPreference: "include",
  chickenPreference: "include",
  fishPreference: "include",
  muttonPreference: "include",
  dairyPreference: "include",
  allergies: [],
  budgetLevel: "medium",
  cookingTimeLevel: "moderate",
  homeCookedOrRestaurant: "home_cooked",
  trainingTimeOfDay: "evening",
  foodsToAvoid: [],
};
