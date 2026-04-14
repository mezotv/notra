import { z } from "@hono/zod-openapi";
import {
  LOOKBACK_WINDOWS,
  SUPPORTED_CONTENT_GENERATION_TYPES,
} from "@notra/content-generation/schemas";

const CRON_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
const MAX_SCHEDULE_NAME_LENGTH = 120;

function splitCommaSeparatedValues(value: string | undefined) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
}

export const scheduleParamsSchema = z.object({
  scheduleId: z
    .string()
    .trim()
    .min(1, "scheduleId is required")
    .openapi({
      param: {
        in: "path",
        name: "scheduleId",
      },
      example: "sched_123",
    }),
});

export const getSchedulesQuerySchema = z.object({
  repositoryIds: z
    .string()
    .optional()
    .transform((value) => splitCommaSeparatedValues(value))
    .openapi({
      description: "Filter by repository IDs using a comma-separated list",
      example: "repo_123,repo_456",
    }),
});

export const cronConfigSchema = z
  .object({
    frequency: z.enum(CRON_FREQUENCIES),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.frequency === "weekly" && value.dayOfWeek === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfWeek"],
        message: "dayOfWeek is required for weekly schedules",
      });
    }

    if (value.frequency === "monthly" && value.dayOfMonth === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfMonth"],
        message: "dayOfMonth is required for monthly schedules",
      });
    }
  });

export const scheduleSourceConfigSchema = z.object({
  cron: cronConfigSchema,
});

export const scheduleTargetsSchema = z.object({
  repositoryIds: z.array(z.string().trim().min(1)).min(1),
});

export const scheduleOutputConfigSchema = z
  .object({
    publishDestination: z.enum(["webflow", "framer", "custom"]).optional(),
    brandVoiceId: z.string().trim().min(1).optional(),
  })
  .optional();

export const createScheduleRequestSchema = z.object({
  name: z.string().trim().min(1).max(MAX_SCHEDULE_NAME_LENGTH),
  sourceType: z.literal("cron"),
  sourceConfig: scheduleSourceConfigSchema,
  targets: scheduleTargetsSchema,
  outputType: z.enum(SUPPORTED_CONTENT_GENERATION_TYPES),
  outputConfig: scheduleOutputConfigSchema,
  enabled: z.boolean(),
  autoPublish: z.boolean().default(false),
  lookbackWindow: z.enum(LOOKBACK_WINDOWS).default("last_7_days"),
});

export const patchScheduleRequestSchema = createScheduleRequestSchema;

const scheduleSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  sourceType: z.literal("cron"),
  sourceConfig: scheduleSourceConfigSchema,
  targets: scheduleTargetsSchema,
  outputType: z.enum(SUPPORTED_CONTENT_GENERATION_TYPES),
  outputConfig: scheduleOutputConfigSchema.nullable().optional(),
  enabled: z.boolean(),
  autoPublish: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lookbackWindow: z.enum(LOOKBACK_WINDOWS),
});

const organizationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
});

export const getSchedulesResponseSchema = z.object({
  schedules: z.array(scheduleSchema),
  repositoryMap: z.record(z.string(), z.string()),
  organization: organizationSchema,
});

export const scheduleResponseSchema = z.object({
  schedule: scheduleSchema,
  organization: organizationSchema,
});

export const deleteScheduleResponseSchema = z.object({
  id: z.string(),
  organization: organizationSchema,
});
