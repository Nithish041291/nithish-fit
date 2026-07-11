import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema, weekdaySchema } from "./common";

export const plannedExerciseSchema = z.object({
  id: idSchema,
  workoutDayId: idSchema,
  exerciseSlug: z.string(),
  orderIndex: z.number().int().min(0),
  targetSets: z.number().int().min(1).max(10),
  targetRepsLow: z.number().int().min(1).max(50),
  targetRepsHigh: z.number().int().min(1).max(50),
  restSeconds: z.number().int().min(15).max(600),
  notes: z.string().optional(),
});
export type PlannedExercise = z.infer<typeof plannedExerciseSchema>;

export const workoutDaySchema = z.object({
  id: idSchema,
  programmeId: idSchema,
  label: z.string(),
  weekday: weekdaySchema.nullable(),
  isRestDay: z.boolean(),
  orderIndex: z.number().int().min(0),
});
export type WorkoutDay = z.infer<typeof workoutDaySchema>;

export const workoutProgrammeSchema = z.object({
  id: idSchema,
  userId: idSchema,
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  startedOn: isoDateSchema,
  cycleWeeks: z.number().int().min(1).max(12).default(5),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type WorkoutProgramme = z.infer<typeof workoutProgrammeSchema>;
