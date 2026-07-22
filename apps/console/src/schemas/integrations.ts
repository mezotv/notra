// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const mcpUrlSchema = z
  .string()
  .trim()
  .min(1, "Server URL is required")
  .max(2048, "Server URL is too long")
  .pipe(z.url({ protocol: /^https$/ }));

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

export const brandingAssetUrlSchema = z
  .url({ protocol: /^https$/ })
  .max(2048, "Image URL is too long")
  .optional()
  .nullable();

export const BRAND_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const brandingAssetKindSchema = z.enum([
  "logo-light",
  "logo-dark",
  "banner",
]);

export const brandingUploadRequestSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required").max(128),
  kind: brandingAssetKindSchema,
  file: z
    .instanceof(File, { error: "File is required" })
    .refine((file) => file.size > 0 && file.size <= MAX_BRANDING_ASSET_BYTES, {
      message: "Images must be 4MB or smaller",
    })
    .refine((file) => Object.hasOwn(BRANDING_ASSET_CONTENT_TYPES, file.type), {
      message: "Use a PNG, JPG, SVG, or WebP image",
    }),
});

export const brandingUploadSuccessSchema = z.object({
  url: z.string(),
});

export const brandingUploadErrorSchema = z.object({
  error: z.string(),
});

export const MAX_BRANDING_ASSET_BYTES = 4 * 1024 * 1024;

export const MAX_BRANDING_UPLOAD_REQUEST_BYTES =
  MAX_BRANDING_ASSET_BYTES + 64 * 1024;

export const BRANDING_ASSET_CONTENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

const createMcpServerRequestFieldsSchema = z.object({
  authType: z.enum(["none", "headers", "oauth"]),
  ownershipConsent: z.literal(true, {
    error:
      "Confirm that you own or represent this MCP server and allow Notra to use its branding",
  }),
  organizationId: z.string().min(1, "Organization ID is required"),
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens"
    ),
  url: mcpUrlSchema,
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  author: z
    .string()
    .trim()
    .max(120, "Author is too long")
    .optional()
    .nullable(),
  websiteUrl: z
    .url({ protocol: /^https$/, error: "Website must be an https URL" })
    .max(2048, "Website URL is too long")
    .optional()
    .nullable(),
  brandColor: z
    .string()
    .trim()
    .regex(BRAND_COLOR_REGEX, "Use a hex color like #7C5CFF")
    .optional()
    .nullable(),
  logoLightUrl: brandingAssetUrlSchema,
  logoDarkUrl: brandingAssetUrlSchema,
  bannerUrl: brandingAssetUrlSchema,
  headers: mcpHeadersSchema,
});

export const createMcpServerRequestSchema =
  createMcpServerRequestFieldsSchema.superRefine((value, context) => {
    if (
      value.authType === "headers" &&
      Object.keys(value.headers).length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Add at least one authentication header",
        path: ["headers"],
      });
    }
  });

export const testMcpServerRequestSchema =
  createMcpServerRequestFieldsSchema.pick({
    organizationId: true,
    url: true,
    headers: true,
  });

const mcpServerIdFieldsSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  serverId: z.string().min(1, "MCP server ID is required"),
});

export const updateMcpServerRequestSchema =
  createMcpServerRequestFieldsSchema.extend(mcpServerIdFieldsSchema.shape);

export const setMcpServerEnabledRequestSchema = mcpServerIdFieldsSchema.extend({
  enabled: z.boolean(),
});

export const MAX_TOOL_ACTION_PHRASE_LENGTH = 80;

const toolActionPhraseSchema = z
  .string()
  .trim()
  .max(MAX_TOOL_ACTION_PHRASE_LENGTH, "Keep action phrases under 80 characters")
  .transform((value) => (value.length === 0 ? null : value))
  .nullable();

export const updateMcpToolPhrasesRequestSchema = mcpServerIdFieldsSchema.extend(
  {
    tools: z
      .array(
        z.object({
          serverToolName: z.string().min(1).max(256),
          actionPhrasePresent: toolActionPhraseSchema,
          actionPhrasePast: toolActionPhraseSchema,
        })
      )
      .max(200, "Too many tools"),
    manualToolNames: z
      .array(z.string().trim().min(1).max(256))
      .max(200, "Too many tools")
      .optional(),
  }
);

export const toolPhraseImportFileSchema = z
  .array(
    z.object({
      serverToolName: z.string().trim().min(1).max(256),
      actionPhrasePresent: toolActionPhraseSchema.optional(),
      actionPhrasePast: toolActionPhraseSchema.optional(),
    })
  )
  .max(200, "Too many tools")
  .superRefine((entries, context) => {
    const seen = new Set<string>();
    for (const [index, entry] of entries.entries()) {
      if (seen.has(entry.serverToolName)) {
        context.addIssue({
          code: "custom",
          message: `Tool "${entry.serverToolName}" is listed more than once`,
          path: [index, "serverToolName"],
        });
      }
      seen.add(entry.serverToolName);
    }
  });

export const submitMcpServerForReviewRequestSchema = mcpServerIdFieldsSchema;

const mcpOAuthCallbackPathSchema = z
  .string()
  .trim()
  .startsWith("/")
  .refine((path) => !path.startsWith("//"), "Invalid callback path");

export const beginMcpOAuthScanRequestSchema = mcpServerIdFieldsSchema.extend({
  callbackPath: mcpOAuthCallbackPathSchema,
});

export const mcpOAuthCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
  state: z.string().min(1),
});

export const reviewMcpServerRequestSchema = z.object({
  serverId: z.string().min(1, "MCP server ID is required"),
  action: z.enum(["approve", "reject"]),
  submittedAt: z.iso.datetime().nullable(),
  note: z
    .string()
    .trim()
    .max(1000, "Review note is too long")
    .optional()
    .nullable(),
});
