import { z } from "zod";

/** All entity ids are strings — uuid in Supabase, nanoid in demo/IndexedDB mode. */
export const idSchema = z.string().min(1);
export type Id = z.infer<typeof idSchema>;

/** ISO-8601 date-time string, e.g. new Date().toISOString(). */
export const isoDateTimeSchema = z.string().datetime({ offset: true });
/** ISO-8601 calendar date, e.g. "2026-07-11". */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const weekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type Weekday = z.infer<typeof weekdaySchema>;

export const wristLoadCategorySchema = z.enum(["low", "moderate", "high"]);
export type WristLoadCategory = z.infer<typeof wristLoadCategorySchema>;

export const gripTypeSchema = z.enum([
  "neutral",
  "pronated",
  "supinated",
  "machine_handle",
  "cable_handle",
  "none",
]);
export type GripType = z.infer<typeof gripTypeSchema>;

export const loadBasisSchema = z.enum(["per_hand", "total", "machine_stack", "bodyweight"]);
export type LoadBasis = z.infer<typeof loadBasisSchema>;

export const muscleGroupSchema = z.enum([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "traps",
  "lats",
  "full_body",
]);
export type MuscleGroup = z.infer<typeof muscleGroupSchema>;

export const movementPatternSchema = z.enum([
  "horizontal_push",
  "horizontal_pull",
  "vertical_push",
  "vertical_pull",
  "squat",
  "hinge",
  "lunge",
  "carry",
  "rotation",
  "isolation_flexion",
  "isolation_extension",
  "calf_raise",
  "cardio",
]);
export type MovementPattern = z.infer<typeof movementPatternSchema>;

export const equipmentTypeSchema = z.enum([
  "dumbbell",
  "bench",
  "leg_press_machine",
  "leg_extension_machine",
  "leg_curl_machine",
  "lat_pulldown_machine",
  "seated_row_machine",
  "cable_stack",
  "cable_curl_station",
  "triceps_rope",
  "treadmill",
  "smith_machine",
  "rear_delt_cable_station",
  "barbell",
  "bodyweight",
  "floor_space",
  "chest_press_machine",
  "shoulder_press_machine",
]);
export type EquipmentType = z.infer<typeof equipmentTypeSchema>;

export const painSeveritySchema = z.number().int().min(0).max(10);
export const rirSchema = z.number().min(0).max(10);
export const difficultySchema = z.number().int().min(1).max(10);

export const trainingGoalSchema = z.enum([
  "fat_loss",
  "muscle_gain",
  "maintenance",
  "recomposition",
]);

export const activityLevelSchema = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "custom",
]);
export type ActivityLevel = z.infer<typeof activityLevelSchema>;

export const sexSchema = z.enum(["male", "female"]);

/** Decimal-safe numeric string helper — stored/transported as string, parsed with Number() at calc boundaries. */
export const decimalSchema = z.union([z.number(), z.string()]).transform((v) => Number(v));
