import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema } from "./common";

export const supplementLogSchema = z.object({
  id: idSchema,
  userId: idSchema,
  date: isoDateSchema,
  type: z.enum(["creatine", "whey"]),
  amount: z.string(),
  taken: z.boolean(),
  takenAt: isoDateTimeSchema.nullable(),
});
export type SupplementLog = z.infer<typeof supplementLogSchema>;
