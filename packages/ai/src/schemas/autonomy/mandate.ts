import { capabilityNameSchema } from "@notra/ai/schemas/autonomy/capability";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const MANDATE_NAME_MAX_LENGTH = 120;
export const MANDATE_OBJECTIVE_MAX_LENGTH = 2000;
export const MANDATE_MAX_ACTIONS_PER_DAY = 500;
export const MANDATE_MAX_TASKS_PER_PLAN_LIMIT = 25;
export const MANDATE_DEFAULT_MAX_TASKS_PER_PLAN = 10;
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
  maxActionsPerDay: z.number().int().min(0).max(MANDATE_MAX_ACTIONS_PER_DAY),
  maxCostCentsPerDay: z.number().int().min(0),
  maxTasksPerPlan: z
    .number()
    .int()
    .min(1)
    .max(MANDATE_MAX_TASKS_PER_PLAN_LIMIT)
    .default(MANDATE_DEFAULT_MAX_TASKS_PER_PLAN),
  autoPublish: z.boolean(),
  quietHoursUtc: quietHoursSchema.optional(),
});
export type MandatePolicy = z.infer<typeof mandatePolicySchema>;

export const mandateStatusSchema = z.enum(["active", "paused", "revoked"]);
export type MandateStatus = z.infer<typeof mandateStatusSchema>;

export const mandateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1).max(MANDATE_NAME_MAX_LENGTH),
  objective: z.string().min(1).max(MANDATE_OBJECTIVE_MAX_LENGTH),
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
