import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";

export const applicationSettingSchema = z.object({
  id: idSchema,
  userId: idSchema,
  key: z.string(),
  value: z.string(),
  updatedAt: isoDateTimeSchema,
});
export type ApplicationSetting = z.infer<typeof applicationSettingSchema>;
