import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema } from "./common";

export const mealSlotSchema = z.enum([
  "early_morning",
  "breakfast",
  "mid_morning",
  "lunch",
  "pre_workout",
  "post_workout",
  "dinner",
  "before_bed",
]);
export type MealSlot = z.infer<typeof mealSlotSchema>;

export const mealPlanPreferenceSchema = z.object({
  style: z.enum(["north_indian", "south_indian", "mixed_indian"]),
  mealsPerDay: z.number().int().min(3).max(8),
  vegetarianDaysPerWeek: z.number().int().min(0).max(7),
  eggPreference: z.enum(["include", "exclude"]),
  chickenPreference: z.enum(["include", "exclude"]),
  fishPreference: z.enum(["include", "exclude"]),
  muttonPreference: z.enum(["include", "exclude"]),
  dairyPreference: z.enum(["include", "limited", "exclude"]),
  allergies: z.array(z.string()).default([]),
  budgetLevel: z.enum(["low", "medium", "high"]),
  cookingTimeLevel: z.enum(["minimal", "moderate", "elaborate"]),
  homeCookedOrRestaurant: z.enum(["home_cooked", "mixed", "restaurant"]),
  trainingTimeOfDay: z.enum(["early_morning", "morning", "evening", "night"]),
  foodsToAvoid: z.array(z.string()).default([]),
});
export type MealPlanPreference = z.infer<typeof mealPlanPreferenceSchema>;

export const plannedMealSchema = z.object({
  id: idSchema,
  mealPlanDayId: idSchema,
  slot: mealSlotSchema,
  title: z.string(),
  items: z.array(
    z.object({
      foodItemId: idSchema.nullable(),
      recipeId: idSchema.nullable(),
      name: z.string(),
      quantityGrams: z.number().min(0).max(5000),
      displayQuantity: z.string(),
    })
  ),
  calories: z.number().min(0).max(3000),
  proteinG: z.number().min(0).max(300),
  carbsG: z.number().min(0).max(400),
  fatG: z.number().min(0).max(200),
  fibreG: z.number().min(0).max(100),
  preparationGuidance: z.string(),
  swapOptions: z.array(z.string()).default([]),
});
export type PlannedMeal = z.infer<typeof plannedMealSchema>;

export const mealPlanDaySchema = z.object({
  id: idSchema,
  mealPlanId: idSchema,
  dayIndex: z.number().int().min(0).max(6),
  date: isoDateSchema.nullable(),
  isVegetarianDay: z.boolean(),
});
export type MealPlanDay = z.infer<typeof mealPlanDaySchema>;

export const mealPlanSchema = z.object({
  id: idSchema,
  userId: idSchema,
  name: z.string(),
  startDate: isoDateSchema,
  preferences: mealPlanPreferenceSchema,
  targetCalories: z.number().min(800).max(6000),
  targetProteinG: z.number().min(20).max(400),
  targetFatG: z.number().min(10).max(250),
  targetFibreG: z.number().min(10).max(80),
  createdAt: isoDateTimeSchema,
});
export type MealPlan = z.infer<typeof mealPlanSchema>;
