// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const generateChangelogBodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

export type GenerateChangelogBody = z.infer<typeof generateChangelogBodySchema>;

export const scheduleWorkflowPayloadSchema = z.object({
  triggerId: z.string().min(1),
  manual: z.boolean().optional().default(false),
});

export type ScheduleWorkflowPayload = z.infer<
  typeof scheduleWorkflowPayloadSchema
>;

export const eventWorkflowPayloadSchema = z.object({
  triggerId: z.string().min(1),
  eventType: z.string().min(1),
  eventAction: z.string(),
  eventData: z.record(z.string(), z.unknown()),
  repositoryId: z.string().min(1),
  deliveryId: z.string().optional(),
});

export type EventWorkflowPayload = z.infer<typeof eventWorkflowPayloadSchema>;
