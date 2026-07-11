import { z } from "zod";
import { difficultySchema, idSchema, isoDateSchema, isoDateTimeSchema, painSeveritySchema, rirSchema } from "./common";

export const readinessEntrySchema = z.object({
  id: idSchema,
  userId: idSchema,
  date: isoDateSchema,
  sleepHours: z.number().min(0).max(14),
  energyLevel: z.number().int().min(1).max(5),
  muscleSoreness: z.number().int().min(1).max(5),
  wristPain: painSeveritySchema,
  stressLevel: z.number().int().min(1).max(5),
  createdAt: isoDateTimeSchema,
});
export type ReadinessEntry = z.infer<typeof readinessEntrySchema>;

export const exerciseSetSchema = z.object({
  id: idSchema,
  performanceId: idSchema,
  setNumber: z.number().int().min(1),
  suggestedWeightKg: z.number().min(0).max(500).nullable(),
  actualWeightKg: z.number().min(0).max(500).nullable(),
  suggestedReps: z.number().int().min(0).max(100).nullable(),
  actualReps: z.number().int().min(0).max(100).nullable(),
  rir: rirSchema.nullable(),
  painScore: painSeveritySchema.nullable(),
  completed: z.boolean(),
  timestamp: isoDateTimeSchema,
  note: z.string().optional(),
});
export type ExerciseSet = z.infer<typeof exerciseSetSchema>;

export const exercisePerformanceSchema = z.object({
  id: idSchema,
  sessionId: idSchema,
  exerciseSlug: z.string(),
  orderIndex: z.number().int().min(0),
  wasSkipped: z.boolean().default(false),
  wasReplacedBySlug: z.string().nullable().default(null),
  wasAddedExtra: z.boolean().default(false),
  note: z.string().optional(),
});
export type ExercisePerformance = z.infer<typeof exercisePerformanceSchema>;

export const workoutSessionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  programmeId: idSchema.nullable(),
  workoutDayId: idSchema.nullable(),
  label: z.string(),
  date: isoDateSchema,
  startedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  status: z.enum(["planned", "in_progress", "completed", "skipped"]),
  readinessEntryId: idSchema.nullable(),
  sessionDifficulty: difficultySchema.nullable(),
  wristPainScore: painSeveritySchema.nullable(),
  notes: z.string().optional(),
  isDeload: z.boolean().default(false),
  durationMinutes: z.number().min(0).max(300).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
