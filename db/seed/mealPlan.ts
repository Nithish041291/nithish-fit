import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { FoodIndexItem } from "@/lib/mealplan/generate";
import { generateMealPlan } from "@/lib/mealplan/generate";
import { defaultMealPlanPreferences } from "./mealPlanPreferences";
import { foodItemSeed } from "./foods";
import { nutritionTargetSeed } from "./profile";

/** Build a foodIndex keyed by slug (id === slug for all seed food items). */
const foodIndex: Record<string, FoodIndexItem> = {};
for (const food of foodItemSeed) {
  foodIndex[food.slug] = {
    id: food.id,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    fibrePer100g: food.fibrePer100g,
  };
}

const startDate = new Date().toISOString().slice(0, 10);

const generated = generateMealPlan({
  userId: DEMO_USER_ID,
  startDate,
  preferences: defaultMealPlanPreferences,
  targetCalories: nutritionTargetSeed.calorieTargetKcal,
  targetProteinG: nutritionTargetSeed.proteinTargetG,
  targetFatG: nutritionTargetSeed.fatTargetG,
  targetFibreG: nutritionTargetSeed.fibreTargetG,
  foodIndex,
});

export const mealPlanSeed = generated.mealPlan;
export const mealPlanDaysSeed = generated.days;
export const plannedMealsSeed = generated.meals;
