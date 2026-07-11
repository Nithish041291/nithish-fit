import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema } from "./common";

export const bodyMeasurementSchema = z.object({
  id: idSchema,
  userId: idSchema,
  date: isoDateSchema,
  weightKg: z.number().min(30).max(300),
  waistCm: z.number().min(30).max(200).nullable(),
  note: z.string().optional(),
  photoMeta: z
    .object({
      fileName: z.string(),
      caption: z.string().optional(),
    })
    .nullable()
    .default(null),
  createdAt: isoDateTimeSchema,
});
export type BodyMeasurement = z.infer<typeof bodyMeasurementSchema>;
