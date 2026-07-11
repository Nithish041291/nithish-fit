import { z } from "zod";
import { activityLevelSchema, idSchema, isoDateSchema, isoDateTimeSchema, sexSchema, trainingGoalSchema, weekdaySchema } from "./common";

export const userProfileSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  sex: sexSchema,
  age: z.number().int().min(10).max(100),
  heightCm: z.number().min(50).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300),
  primaryGoal: trainingGoalSchema,
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"]),
  country: z.string().default("India"),
  dietaryPattern: z.enum([
    "indian_vegetarian",
    "indian_non_vegetarian",
    "indian_eggetarian",
    "other",
  ]),
  trainingDays: z.array(weekdaySchema),
  restDays: z.array(weekdaySchema),
  gymType: z.string(),
  preferredWorkoutDurationMinMinutes: z.number().int().min(15).max(180),
  preferredWorkoutDurationMaxMinutes: z.number().int().min(15).max(180),
  creatineGramsPerDay: z.number().min(0).max(20),
  wheyScoopsPerTrainingDay: z.number().min(0).max(5),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const userPreferenceSchema = z.object({
  id: idSchema,
  userId: idSchema,
  units: z.enum(["metric"]).default("metric"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  activityLevel: activityLevelSchema,
  customActivityMultiplier: z.number().min(1).max(3).nullable(),
  calorieDeficitPercent: z.number().min(0).max(35),
  proteinGramsPerKg: z.number().min(1).max(3),
  fatGramsPerKgTarget: z.number().min(0.3).max(2),
  fibreTargetGramsMin: z.number().min(10).max(80),
  fibreTargetGramsMax: z.number().min(10).max(80),
  waterTargetMl: z.number().min(500).max(6000),
  updatedAt: isoDateTimeSchema,
});
export type UserPreference = z.infer<typeof userPreferenceSchema>;

export const medicalRestrictionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  label: z.string(),
  description: z.string(),
  bodyPart: z.string(),
  maxLoadPerHandKg: z.number().min(0).max(200).nullable(),
  active: z.boolean().default(true),
  since: isoDateSchema,
  notes: z.string().optional(),
  createdAt: isoDateTimeSchema,
});
export type MedicalRestriction = z.infer<typeof medicalRestrictionSchema>;
