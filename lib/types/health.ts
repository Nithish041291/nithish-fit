import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema } from "./common";

/** Daily calorie-burn totals synced in from a wearable (currently: Apple Watch via the Health
 * Auto Export app's REST API automation). One row per user per calendar day. */
export const dailyEnergyLogSchema = z.object({
  id: idSchema,
  userId: idSchema,
  date: isoDateSchema,
  activeEnergyKcal: z.number().min(0),
  restingEnergyKcal: z.number().min(0).nullable(),
  source: z.string(),
  syncedAt: isoDateTimeSchema,
});
export type DailyEnergyLog = z.infer<typeof dailyEnergyLogSchema>;
