import { z } from "zod";
import {
  equipmentTypeSchema,
  gripTypeSchema,
  idSchema,
  isoDateTimeSchema,
  loadBasisSchema,
  movementPatternSchema,
  muscleGroupSchema,
  wristLoadCategorySchema,
} from "./common";

export const exerciseSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  primaryMuscles: z.array(muscleGroupSchema).min(1),
  secondaryMuscles: z.array(muscleGroupSchema).default([]),
  movementPattern: movementPatternSchema,
  equipment: z.array(equipmentTypeSchema).min(1),
  isCompound: z.boolean(),
  isUnilateral: z.boolean(),
  loadBasis: loadBasisSchema,
  setupInstructions: z.string(),
  executionInstructions: z.string(),
  breathingGuidance: z.string(),
  commonMistakes: z.array(z.string()).default([]),
  wristLoadCategory: wristLoadCategorySchema,
  recommendedGrip: gripTypeSchema,
  perHandOrTotalNote: z.string(),
  safetyNote: z.string(),
  contraindications: z.array(z.string()).default([]),
  perHandWeightLimitKg: z.number().min(0).max(200).nullable(),
  suggestedRepRangeLow: z.number().int().min(1).max(50),
  suggestedRepRangeHigh: z.number().int().min(1).max(50),
  progressionMethod: z.string(),
  substituteExerciseSlugs: z.array(z.string()).default([]),
  videoUrl: z.string().url().nullable().default(null),
  isSelectableByDefault: z.boolean(),
  createdAt: isoDateTimeSchema.optional(),
  updatedAt: isoDateTimeSchema.optional(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const exerciseAliasSchema = z.object({
  id: idSchema,
  exerciseSlug: z.string(),
  alias: z.string(),
});
export type ExerciseAlias = z.infer<typeof exerciseAliasSchema>;

export const exerciseSubstitutionSchema = z.object({
  id: idSchema,
  exerciseSlug: z.string(),
  substituteSlug: z.string(),
  reason: z.string(),
});
export type ExerciseSubstitution = z.infer<typeof exerciseSubstitutionSchema>;
