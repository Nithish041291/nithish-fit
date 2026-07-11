import { z } from "zod";
import { activityLevelSchema, idSchema, isoDateSchema, isoDateTimeSchema } from "./common";

export const nutritionTargetSchema = z.object({
  id: idSchema,
  userId: idSchema,
  effectiveFrom: isoDateSchema,
  bmrKcal: z.number().min(500).max(5000),
  activityLevel: activityLevelSchema,
  activityMultiplier: z.number().min(1).max(3),
  maintenanceKcal: z.number().min(800).max(6000),
  deficitPercent: z.number().min(0).max(35),
  calorieTargetKcal: z.number().min(800).max(6000),
  proteinTargetG: z.number().min(20).max(400),
  fatTargetG: z.number().min(10).max(250),
  carbTargetG: z.number().min(0).max(800),
  fibreTargetG: z.number().min(10).max(80),
  isActive: z.boolean(),
  isUserOverride: z.boolean().default(false),
  createdAt: isoDateTimeSchema,
});
export type NutritionTarget = z.infer<typeof nutritionTargetSchema>;

export const reliabilitySchema = z.enum(["verified", "estimated", "user_provided"]);
export const rawCookedSchema = z.enum(["raw", "cooked", "not_applicable"]);

export const foodServingSchema = z.object({
  id: idSchema,
  foodItemId: idSchema,
  unit: z.enum([
    "gram",
    "kilogram",
    "millilitre",
    "litre",
    "teaspoon",
    "tablespoon",
    "cup",
    "glass",
    "bowl",
    "katori",
    "piece",
    "slice",
    "roti",
    "chapati",
    "scoop",
    "serving",
  ]),
  gramsEquivalent: z.number().min(0.1).max(5000),
  label: z.string(),
  isDefault: z.boolean().default(false),
});
export type FoodServing = z.infer<typeof foodServingSchema>;

export const foodItemSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  cuisineTag: z.string().optional(),
  rawCookedState: rawCookedSchema,
  preparationMethod: z.string().optional(),
  caloriesPer100g: z.number().min(0).max(950),
  proteinPer100g: z.number().min(0).max(100),
  carbsPer100g: z.number().min(0).max(100),
  fatPer100g: z.number().min(0).max(100),
  fibrePer100g: z.number().min(0).max(60),
  source: z.string(),
  measurementBasis: z.string(),
  reliability: reliabilitySchema,
  lastUpdated: isoDateSchema,
  isCustom: z.boolean().default(false),
  ownerUserId: idSchema.nullable().default(null),
});
export type FoodItem = z.infer<typeof foodItemSchema>;

export const foodAliasSchema = z.object({
  id: idSchema,
  foodItemId: idSchema,
  alias: z.string(),
  isUserCorrection: z.boolean().default(false),
  ownerUserId: idSchema.nullable().default(null),
});
export type FoodAlias = z.infer<typeof foodAliasSchema>;

export const recipeIngredientSchema = z.object({
  id: idSchema,
  recipeId: idSchema,
  foodItemId: idSchema,
  quantityGrams: z.number().min(0).max(10000),
  note: z.string().optional(),
});
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

export const recipeSchema = z.object({
  id: idSchema,
  userId: idSchema,
  name: z.string(),
  cuisineTag: z.string().optional(),
  totalCookedWeightGrams: z.number().min(1).max(20000),
  servings: z.number().min(1).max(30),
  cookingOilGrams: z.number().min(0).max(1000).default(0),
  instructions: z.string().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type Recipe = z.infer<typeof recipeSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const foodLogSchema = z.object({
  id: idSchema,
  userId: idSchema,
  date: isoDateSchema,
  loggedAt: isoDateTimeSchema,
  rawText: z.string(),
  foodItemId: idSchema.nullable(),
  recipeId: idSchema.nullable(),
  customName: z.string().nullable(),
  quantityGrams: z.number().min(0).max(10000),
  unit: z.string(),
  unitQuantity: z.number().min(0).max(1000),
  mealSlot: z.enum([
    "early_morning",
    "breakfast",
    "mid_morning",
    "lunch",
    "pre_workout",
    "post_workout",
    "dinner",
    "before_bed",
    "unspecified",
  ]),
  calories: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(500),
  fibreG: z.number().min(0).max(200),
  confidence: confidenceSchema,
  source: z.string(),
  wasEdited: z.boolean().default(false),
  createdAt: isoDateTimeSchema,
});
export type FoodLog = z.infer<typeof foodLogSchema>;
