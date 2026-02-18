// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { GITHUB_URL_PATTERNS } from "@/utils/constants";

export const INPUT_INTEGRATION_TYPES = ["github", "slack", "linear"] as const;
export type InputIntegrationType = (typeof INPUT_INTEGRATION_TYPES)[number];

const OUTPUT_INTEGRATION_TYPES = ["marble", "webflow", "framer"] as const;

export const INTEGRATION_TYPES = [
  ...INPUT_INTEGRATION_TYPES,
  ...OUTPUT_INTEGRATION_TYPES,
] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const OUTPUT_CONTENT_TYPES = [
  "changelog",
  "blog_post",
  "twitter_post",
  "linkedin_post",
  "investor_update",
] as const;
export type OutputContentType = (typeof OUTPUT_CONTENT_TYPES)[number];

function isValidGitHubUrl(url: string): boolean {
  const trimmed = url.trim();
  return GITHUB_URL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export const addGitHubIntegrationFormSchema = z.object({
  repoUrl: z
    .string()
    .min(1, "Repository URL is required")
    .refine(
      (value) => isValidGitHubUrl(value),
      "Invalid GitHub repository URL or format. Use: https://github.com/owner/repo, git@github.com:owner/repo, or owner/repo"
    ),
  branch: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
});
export type AddGitHubIntegrationFormValues = z.infer<
  typeof addGitHubIntegrationFormSchema
>;

export const createGitHubIntegrationRequestSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  owner: z.string().min(1, "Repository owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  branch: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
});
export const addRepositoryRequestSchema = z.object({
  owner: z
    .string()
    .min(1, "Repository owner is required")
    .transform((value) => value.trim()),
  repo: z
    .string()
    .min(1, "Repository name is required")
    .transform((value) => value.trim()),
  outputs: z
    .array(
      z.object({
        type: z.enum(OUTPUT_CONTENT_TYPES),
        enabled: z.boolean(),
      })
    )
    .optional()
    .default([
      { type: "changelog", enabled: true },
      { type: "blog_post", enabled: false },
      { type: "twitter_post", enabled: false },
      { type: "linkedin_post", enabled: false },
      { type: "investor_update", enabled: false },
    ]),
});
export const integrationIdParamSchema = z.object({
  integrationId: z.string().min(1, "Integration ID is required"),
});

export const repositoryIdParamSchema = z.object({
  repositoryId: z.string().min(1, "Repository ID is required"),
});

export const outputIdParamSchema = z.object({
  outputId: z.string().min(1, "Output ID is required"),
});

export const updateIntegrationBodySchema = z.object({
  enabled: z.boolean(),
  displayName: z.string().trim().min(1).optional(),
  branch: z.string().trim().min(1).nullable().optional(),
});

export const editGitHubIntegrationFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  enabled: z.boolean(),
  branch: z.string().optional().nullable(),
});
export type EditGitHubIntegrationFormValues = z.infer<
  typeof editGitHubIntegrationFormSchema
>;

export const updateRepositoryBodySchema = z
  .object({
    enabled: z.boolean().optional(),
    defaultBranch: z.string().trim().min(1).optional().nullable(),
  })
  .refine(
    (value) => value.enabled !== undefined || value.defaultBranch !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export const updateOutputBodySchema = z.object({
  enabled: z.boolean(),
});

export const configureOutputBodySchema = z.object({
  outputType: z.enum(OUTPUT_CONTENT_TYPES),
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const WEBHOOK_EVENT_TYPES = ["release", "push", "star"] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const CRON_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type CronFrequency = (typeof CRON_FREQUENCIES)[number];

export const LOOKBACK_WINDOWS = [
  "current_day",
  "yesterday",
  "last_7_days",
  "last_14_days",
  "last_30_days",
] as const;
export type LookbackWindow = (typeof LOOKBACK_WINDOWS)[number];

export const MAX_SCHEDULE_NAME_LENGTH = 120;

const triggerSourceTypeSchema = z.enum([
  "github_webhook",
  "linear_webhook",
  "cron",
  "manual",
]);

const triggerSourceConfigSchema = z.object({
  eventTypes: z.array(z.enum(WEBHOOK_EVENT_TYPES)).optional(),
  cron: z
    .object({
      frequency: z.enum(CRON_FREQUENCIES),
      hour: z.number().min(0).max(23),
      minute: z.number().min(0).max(59),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
    })
    .optional(),
});

export const triggerTargetsSchema = z.object({
  repositoryIds: z.array(z.string()).min(1),
});

const triggerOutputConfigSchema = z
  .object({
    publishDestination: z.enum(["webflow", "framer", "custom"]).optional(),
  })
  .optional();

export const configureTriggerBodySchema = z.object({
  sourceType: triggerSourceTypeSchema,
  sourceConfig: triggerSourceConfigSchema,
  targets: triggerTargetsSchema,
  outputType: z.enum(OUTPUT_CONTENT_TYPES),
  outputConfig: triggerOutputConfigSchema,
  enabled: z.boolean(),
});

const SUPPORTED_SCHEDULE_OUTPUT_TYPES = ["changelog"] as const;

export const configureScheduleBodySchema = configureTriggerBodySchema.extend({
  name: z.string().trim().min(1).max(MAX_SCHEDULE_NAME_LENGTH),
  sourceType: z.literal("cron"),
  sourceConfig: z.object({
    cron: z.object({
      frequency: z.enum(CRON_FREQUENCIES),
      hour: z.number().min(0).max(23),
      minute: z.number().min(0).max(59),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
    }),
  }),
  outputType: z.enum(SUPPORTED_SCHEDULE_OUTPUT_TYPES),
  lookbackWindow: z.enum(LOOKBACK_WINDOWS).default("last_7_days"),
});

export const getSchedulesQuerySchema = z.object({
  repositoryIds: z.array(z.string().min(1)).optional(),
});
