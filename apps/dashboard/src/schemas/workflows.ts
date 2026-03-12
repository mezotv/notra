// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  contentDataPointSettingsSchema,
  onDemandContentTypeSchema,
  selectedItemsSchema,
} from "./content";
import { LOOKBACK_WINDOWS, triggerOutputConfigSchema } from "./integrations";

export const generateChangelogBodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

export type GenerateChangelogBody = z.infer<typeof generateChangelogBodySchema>;

export const scheduleWorkflowPayloadSchema = z.object({
  triggerId: z.string().min(1),
  manual: z.boolean().optional().default(false),
});

export const onDemandContentWorkflowPayloadSchema = z.object({
  organizationId: z.string().min(1),
  runId: z.string().min(1),
  contentType: onDemandContentTypeSchema,
  lookbackWindow: z.enum(LOOKBACK_WINDOWS),
  repositoryIds: z.array(z.string().min(1)).optional(),
  brandVoiceId: z.string().min(1).optional(),
  dataPoints: contentDataPointSettingsSchema,
  selectedItems: selectedItemsSchema.optional(),
  aiCreditReserved: z.boolean(),
});

export type OnDemandContentWorkflowPayload = z.infer<
  typeof onDemandContentWorkflowPayloadSchema
>;

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

export const workflowLookbackWindowSchema = z.enum(LOOKBACK_WINDOWS);

export const nullableTriggerOutputConfigSchema = z.union([
  triggerOutputConfigSchema,
  z.null(),
]);
