// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

export const updateNotificationSettingsSchema = z.object({
  scheduledContentCreation: z.boolean().optional(),
  scheduledContentFailed: z.boolean().optional(),
});

export type UpdateNotificationSettings = z.infer<
  typeof updateNotificationSettingsSchema
>;
