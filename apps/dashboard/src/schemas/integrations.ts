// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { GITHUB_URL_PATTERNS } from "@/constants/github";

export const INTEGRATION_CATEGORIES = ["input", "output"] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export const INPUT_INTEGRATION_TYPES = ["github", "slack", "linear"] as const;
export type InputIntegrationType = (typeof INPUT_INTEGRATION_TYPES)[number];

export const OUTPUT_INTEGRATION_TYPES = [
  "marble",
  "webflow",
  "framer",
] as const;

export const EXTENSION_INTEGRATION_TYPES = ["raycast"] as const;
export type ExtensionIntegrationType =
  (typeof EXTENSION_INTEGRATION_TYPES)[number];
export type OutputIntegrationType = (typeof OUTPUT_INTEGRATION_TYPES)[number];

export const INTEGRATION_TYPES = [
  ...INPUT_INTEGRATION_TYPES,
  ...OUTPUT_INTEGRATION_TYPES,
  ...EXTENSION_INTEGRATION_TYPES,
] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const OUTPUT_CONTENT_TYPES = [
  "changelog",
  "blog_post",
  "twitter_post",
  "linkedin_post",
  "investor_update",
  "image",
] as const;
export type OutputContentType = (typeof OUTPUT_CONTENT_TYPES)[number];

function isValidGitHubUrl(url: string): boolean {
  const trimmed = url.trim();
  return GITHUB_URL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

const GITHUB_PAT_PREFIXES = [
  "ghp_",
  "github_pat_",
  "gho_",
  "ghu_",
  "ghs_",
  "ghr_",
] as const;

export const githubPersonalAccessTokenSchema = z
  .string()
  .trim()
  .min(1, "Personal access token is required")
  .refine(
    (value) => GITHUB_PAT_PREFIXES.some((prefix) => value.startsWith(prefix)),
    "Enter a valid GitHub personal access token"
  );

export const addGitHubIntegrationFormSchema = z.object({
  repoUrl: z
    .string()
    .min(1, "Repository URL is required")
    .refine(
      (value) => isValidGitHubUrl(value),
      "Invalid GitHub repository URL or format. Use: https://github.com/owner/repo, git@github.com:owner/repo, or owner/repo"
    ),
  branch: z.string().optional().nullable(),
  token: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, githubPersonalAccessTokenSchema.optional().nullable()),
});
export type AddGitHubIntegrationFormValues = z.infer<
  typeof addGitHubIntegrationFormSchema
>;

export const createGitHubIntegrationRequestSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  owner: z.string().min(1, "Repository owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  branch: z.string().optional().nullable(),
  token: githubPersonalAccessTokenSchema.optional().nullable(),
});
export type CreateGitHubIntegrationRequest = z.infer<
  typeof createGitHubIntegrationRequestSchema
>;

export const addRepositoryFormSchema = z.object({
  repository: z
    .string()
    .min(1, "Please select a repository")
    .regex(/^[^/]+\/[^/]+$/, "Invalid repository format. Expected: owner/repo"),
});
export type AddRepositoryFormValues = z.infer<typeof addRepositoryFormSchema>;

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
export type AddRepositoryRequest = z.infer<typeof addRepositoryRequestSchema>;

export const getIntegrationsQuerySchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});
export type GetIntegrationsQuery = z.infer<typeof getIntegrationsQuerySchema>;

export const integrationIdParamSchema = z.object({
  integrationId: z.string().min(1, "Integration ID is required"),
});
export type IntegrationIdParam = z.infer<typeof integrationIdParamSchema>;

export const repositoryIdParamSchema = z.object({
  repositoryId: z.string().min(1, "Repository ID is required"),
});
export type RepositoryIdParam = z.infer<typeof repositoryIdParamSchema>;

export const outputIdParamSchema = z.object({
  outputId: z.string().min(1, "Output ID is required"),
});
export type OutputIdParam = z.infer<typeof outputIdParamSchema>;

const repoIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !value.includes("/"), "Cannot contain '/'");

export const updateIntegrationBodySchema = z
  .object({
    enabled: z.boolean().optional(),
    displayName: z.string().trim().min(1).optional(),
    owner: repoIdentifierSchema.optional(),
    repo: repoIdentifierSchema.optional(),
    branch: z.string().trim().min(1).nullable().optional(),
    token: githubPersonalAccessTokenSchema.optional(),
  })
  .refine(
    (value) =>
      value.enabled !== undefined ||
      value.displayName !== undefined ||
      value.owner !== undefined ||
      value.repo !== undefined ||
      value.branch !== undefined ||
      value.token !== undefined,
    {
      message: "At least one field must be provided",
    }
  );
export type UpdateIntegrationBody = z.infer<typeof updateIntegrationBodySchema>;

export const editGitHubIntegrationFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  enabled: z.boolean(),
  owner: z.string().trim().min(1, "Owner is required"),
  repo: z.string().trim().min(1, "Repository name is required"),
  branch: z.string().optional().nullable(),
});
export type EditGitHubIntegrationFormValues = z.infer<
  typeof editGitHubIntegrationFormSchema
>;

export const editGitHubTokenFormSchema = z.object({
  token: githubPersonalAccessTokenSchema,
});
export type EditGitHubTokenFormValues = z.infer<
  typeof editGitHubTokenFormSchema
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
export type UpdateRepositoryBody = z.infer<typeof updateRepositoryBodySchema>;

export const updateOutputBodySchema = z.object({
  enabled: z.boolean(),
});
export type UpdateOutputBody = z.infer<typeof updateOutputBodySchema>;

export const configureOutputBodySchema = z.object({
  outputType: z.enum(OUTPUT_CONTENT_TYPES),
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});
export type ConfigureOutputBody = z.infer<typeof configureOutputBodySchema>;

export const WEBHOOK_EVENT_TYPES = ["release", "push"] as const;
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

export const triggerSourceTypeSchema = z.enum([
  "github_webhook",
  "linear_webhook",
  "cron",
  "manual",
]);

export const triggerSourceConfigSchema = z.object({
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

export const triggerOutputConfigSchema = z
  .object({
    publishDestination: z.enum(["webflow", "framer", "custom"]).optional(),
    brandVoiceId: z.string().optional(),
  })
  .optional();

export const configureTriggerBodySchema = z.object({
  sourceType: triggerSourceTypeSchema,
  sourceConfig: triggerSourceConfigSchema,
  targets: triggerTargetsSchema,
  outputType: z.enum(OUTPUT_CONTENT_TYPES),
  outputConfig: triggerOutputConfigSchema,
  enabled: z.boolean(),
  autoPublish: z.boolean().default(false),
});
export type ConfigureTriggerBody = z.infer<typeof configureTriggerBodySchema>;

export const SUPPORTED_AUTOMATION_OUTPUT_TYPES = [
  "changelog",
  "blog_post",
  "linkedin_post",
  "twitter_post",
  "image",
] as const;
export type AutomationOutputType =
  (typeof SUPPORTED_AUTOMATION_OUTPUT_TYPES)[number];

export type ScheduleOutputType =
  (typeof SUPPORTED_AUTOMATION_OUTPUT_TYPES)[number];

export const configureEventTriggerBodySchema =
  configureTriggerBodySchema.extend({
    sourceType: z.literal("github_webhook"),
    sourceConfig: z.object({
      eventTypes: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1),
    }),
    outputType: z.enum(SUPPORTED_AUTOMATION_OUTPUT_TYPES),
  });
export type ConfigureEventTriggerBody = z.infer<
  typeof configureEventTriggerBodySchema
>;

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
  outputType: z.enum(SUPPORTED_AUTOMATION_OUTPUT_TYPES),
  lookbackWindow: z.enum(LOOKBACK_WINDOWS).default("last_7_days"),
});
export type ConfigureScheduleBody = z.infer<typeof configureScheduleBodySchema>;

export const getSchedulesQuerySchema = z.object({
  repositoryIds: z.array(z.string().min(1)).optional(),
});
export type GetSchedulesQuery = z.infer<typeof getSchedulesQuerySchema>;

export const affectedTriggerSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
});
export type AffectedTrigger = z.infer<typeof affectedTriggerSchema>;

export const affectedTriggersDataSchema = z.object({
  affectedSchedules: z.array(affectedTriggerSchema).optional(),
  affectedEvents: z.array(affectedTriggerSchema).optional(),
});
export type AffectedTriggersData = z.infer<typeof affectedTriggersDataSchema>;

export const deleteResourceResponseSchema = z.object({
  success: z.boolean(),
  disabledSchedules: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  disabledEvents: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .optional(),
});
export type DeleteResourceResponse = z.infer<
  typeof deleteResourceResponseSchema
>;

export const MCP_URL_PROTOCOL_REGEX = /^https?:\/\//i;

export const mcpUrlSchema = z
  .string()
  .trim()
  .min(1, "Server URL is required")
  .max(2048, "Server URL is too long")
  .pipe(z.url({ protocol: /^https$/ }));

export const mcpFormUrlSchema = z
  .string()
  .trim()
  .min(1, "Server URL is required")
  .refine(
    (value) =>
      mcpUrlSchema.safeParse(
        `https://${value.replace(MCP_URL_PROTOCOL_REGEX, "")}`
      ).success,
    "Enter a valid URL"
  );

export const mcpHeaderNameSchema = z
  .string()
  .trim()
  .max(128, "Header name is too long")
  .regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]*$/, "Invalid header name");

export const mcpHeaderValueSchema = z
  .string()
  .trim()
  .max(4096, "Header value is too long");

export const MAX_MCP_HEADERS = 5;

export const mcpHeadersSchema = z
  .record(
    mcpHeaderNameSchema.pipe(z.string().min(1, "Header name is required")),
    mcpHeaderValueSchema.pipe(z.string().min(1, "Header value is required"))
  )
  .refine((headers) => Object.keys(headers).length <= MAX_MCP_HEADERS, {
    message: `You can add up to ${MAX_MCP_HEADERS} headers`,
  })
  .default({});

export const mcpHeaderRowSchema = z.object({
  name: mcpHeaderNameSchema,
  value: mcpHeaderValueSchema,
});
export type McpHeaderRow = z.infer<typeof mcpHeaderRowSchema>;

export const addMcpServerFormFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  url: mcpFormUrlSchema,
  description: z.string().trim().max(1000, "Description is too long"),
  headers: z
    .array(mcpHeaderRowSchema)
    .max(MAX_MCP_HEADERS, `You can add up to ${MAX_MCP_HEADERS} headers`),
});

export const addMcpServerFormSchema = addMcpServerFormFieldsSchema.superRefine(
  (value, ctx) => {
    value.headers.forEach((row, index) => {
      const hasName = row.name.trim() !== "";
      const hasValue = row.value.trim() !== "";
      if (hasName !== hasValue) {
        ctx.addIssue({
          code: "custom",
          message: "Header name and value are required together",
          path: ["headers", index, hasValue ? "name" : "value"],
        });
      }
    });
  }
);

export type AddMcpServerFormValues = z.infer<
  typeof addMcpServerFormFieldsSchema
>;

export const createMcpServerRequestSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  name: addMcpServerFormFieldsSchema.shape.name,
  url: mcpUrlSchema,
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  headers: mcpHeadersSchema,
});
export type CreateMcpServerRequest = z.infer<
  typeof createMcpServerRequestSchema
>;

export const updateMcpServerBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    url: mcpUrlSchema.optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    headers: mcpHeadersSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.url !== undefined ||
      value.description !== undefined ||
      value.headers !== undefined ||
      value.enabled !== undefined,
    {
      message: "At least one field must be provided",
    }
  );
export type UpdateMcpServerBody = z.infer<typeof updateMcpServerBodySchema>;

export const mcpServerIdParamSchema = z.object({
  serverId: z.string().min(1, "MCP server ID is required"),
});

export const testMcpServerRequestSchema = createMcpServerRequestSchema.pick({
  organizationId: true,
  url: true,
  headers: true,
});
export type TestMcpServerRequest = z.infer<typeof testMcpServerRequestSchema>;
