import { capabilityNameSchema } from "@notra/ai/schemas/autonomy/capability";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const MANDATE_MIN_VERSION = 1;
export const QUIET_HOURS_MIN_HOUR = 0;
export const QUIET_HOURS_MAX_HOUR = 23;

export const quietHoursSchema = z.object({
  startHour: z
    .number()
    .int()
    .min(QUIET_HOURS_MIN_HOUR)
    .max(QUIET_HOURS_MAX_HOUR),
  endHour: z.number().int().min(QUIET_HOURS_MIN_HOUR).max(QUIET_HOURS_MAX_HOUR),
});
export type QuietHours = z.infer<typeof quietHoursSchema>;

export const mandatePolicySchema = z.object({
  allowedCapabilities: z.array(capabilityNameSchema).min(1),
  allowedDestinations: z.array(z.string().min(1)),
  maxActionsPerDay: z.number().int().min(0).max(500),
  maxCostCentsPerDay: z.number().int().min(0),
  maxTasksPerPlan: z.number().int().min(1).max(25).default(10),
  autoPublish: z.boolean(),
  quietHoursUtc: quietHoursSchema.optional(),
});
export type MandatePolicy = z.infer<typeof mandatePolicySchema>;

export const mandateStatusSchema = z.enum(["active", "paused", "revoked"]);
export type MandateStatus = z.infer<typeof mandateStatusSchema>;

export const mandateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1).max(120),
  objective: z.string().min(1).max(2000),
  policy: mandatePolicySchema,
  status: mandateStatusSchema,
  version: z.number().int().min(MANDATE_MIN_VERSION),
});
export type Mandate = z.infer<typeof mandateSchema>;

export const mandateRefSchema = z.object({
  mandateId: z.string().min(1),
  mandateVersion: z.number().int().min(MANDATE_MIN_VERSION),
});
export type MandateRef = z.infer<typeof mandateRefSchema>;
