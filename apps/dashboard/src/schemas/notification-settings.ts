import { z } from "zod";

export const updateNotificationSettingsSchema = z.object({
  scheduledContentCreation: z.boolean(),
});

export type UpdateNotificationSettings = z.infer<
  typeof updateNotificationSettingsSchema
>;
