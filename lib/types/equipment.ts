import { z } from "zod";
import { equipmentTypeSchema, idSchema, isoDateTimeSchema } from "./common";

export const equipmentSchema = z.object({
  id: idSchema,
  type: equipmentTypeSchema,
  name: z.string(),
  notes: z.string().optional(),
});
export type Equipment = z.infer<typeof equipmentSchema>;

export const userEquipmentSchema = z.object({
  id: idSchema,
  userId: idSchema,
  equipmentId: idSchema,
  enabled: z.boolean(),
  maxLoadKg: z.number().min(0).max(500).nullable(),
  updatedAt: isoDateTimeSchema,
});
export type UserEquipment = z.infer<typeof userEquipmentSchema>;

/** Configurable dumbbell/plate increments used by the progression engine so it never
 * recommends a weight the user physically cannot select. */
export const availableWeightIncrementSchema = z.object({
  id: idSchema,
  userId: idSchema,
  equipmentType: equipmentTypeSchema,
  incrementKg: z.number().min(0.5).max(25),
  minKg: z.number().min(0).max(100),
  maxKg: z.number().min(0).max(200),
});
export type AvailableWeightIncrement = z.infer<typeof availableWeightIncrementSchema>;
