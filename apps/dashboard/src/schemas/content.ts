import { UI_MESSAGES_MAX, uiMessageSchema } from "@notra/ai/schemas/chat";
import { contentTypeSchema } from "@notra/ai/schemas/content";
import {
  POST_MARKDOWN_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
} from "@notra/ai/schemas/limits";
import { POST_SLUG_MAX_LENGTH } from "@notra/ai/schemas/post";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import {
  LOOKBACK_WINDOWS,
  SUPPORTED_SCHEDULE_OUTPUT_TYPES,
} from "./integrations";

export const postStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const sourceMetadataSchema = z
  .object({
    triggerId: z.string(),
    triggerSourceType: z.string(),
    repositories: z.array(z.object({ owner: z.string(), repo: z.string() })),
    linearIntegrations: z
      .array(z.object({ integrationId: z.string() }))
      .optional(),
    lookbackWindow: z.string(),
    lookbackRange: z.object({ start: z.string(), end: z.string() }),
    brandVoiceName: z.string().optional(),
    brandVoiceId: z.string().optional(),
    selectedCommitShas: z.array(z.string()).optional(),
    selectedPullRequests: z
      .array(z.object({ repositoryId: z.string(), number: z.number() }))
      .optional(),
    selectedReleases: z
      .array(z.object({ repositoryId: z.string(), tagName: z.string() }))
      .optional(),
    selectedLinearIssues: z
      .array(z.object({ integrationId: z.string(), issueId: z.string() }))
      .optional(),
  })
  .nullable()
  .optional();

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;

export const contentSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().nullable(),
  content: z.string(),
  markdown: z.string(),
  recommendations: z.string().nullable(),
  contentType: contentTypeSchema,
  status: postStatusSchema,
  date: z.string(),
  sourceMetadata: sourceMetadataSchema,
});

export type ContentResponse = z.infer<typeof contentSchema>;

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string().nullable(),
  content: z.string(),
  markdown: z.string(),
  recommendations: z.string().nullable(),
  contentType: contentTypeSchema,
  status: postStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Post = z.infer<typeof postSchema>;

export const postsResponseSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
});

export type PostsResponse = z.infer<typeof postsResponseSchema>;

export const editContentSchema = z.object({
  instruction: z.string().min(1, "Instruction is required"),
  currentMarkdown: z.string(),
  selectedText: z.string().optional(),
});

export type EditContentInput = z.infer<typeof editContentSchema>;

export const contextItemSchema = z.object({
  type: z.literal("github-repo"),
  owner: z.string(),
  repo: z.string(),
  integrationId: z.string(),
});

export type ContextItem = z.infer<typeof contextItemSchema>;

export const textSelectionSchema = z.object({
  text: z.string(),
  startLine: z.number(),
  startChar: z.number(),
  endLine: z.number(),
  endChar: z.number(),
});

export type TextSelection = z.infer<typeof textSelectionSchema>;

export const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(UI_MESSAGES_MAX),
  currentMarkdown: z.string().max(POST_MARKDOWN_MAX_LENGTH),
  contentType: z.string().max(100).optional(),
  selection: textSelectionSchema.optional(),
  context: z.array(contextItemSchema).max(50).optional(),
  timezone: z.string().min(1).max(100).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

const slugFieldSchema = z.string().slugify().min(1).max(POST_SLUG_MAX_LENGTH);

export const updateContentSchema = z
  .object({
    title: z.string().trim().min(1).max(POST_TITLE_MAX_LENGTH).optional(),
    slug: slugFieldSchema.nullable().optional(),
    markdown: z.string().min(1).max(POST_MARKDOWN_MAX_LENGTH).optional(),
    status: postStatusSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.slug !== undefined ||
      data.markdown !== undefined ||
      data.status !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export type UpdateContentInput = z.infer<typeof updateContentSchema>;

export const onDemandContentTypeSchema = z.enum(
  SUPPORTED_SCHEDULE_OUTPUT_TYPES
);
export type OnDemandContentType = z.infer<typeof onDemandContentTypeSchema>;

export const contentDataPointSettingsSchema = z.object({
  includePullRequests: z.boolean().default(true),
  includeCommits: z.boolean().default(true),
  includeReleases: z.boolean().default(true),
  includeLinearData: z.boolean().default(false),
});

export type ContentDataPointSettings = z.infer<
  typeof contentDataPointSettingsSchema
>;

export const selectedItemsSchema = z.object({
  commitShas: z.array(z.string()).optional(),
  pullRequestNumbers: z
    .array(
      z.object({
        repositoryId: z.string(),
        number: z.number(),
      })
    )
    .optional(),
  releaseTagNames: z
    .array(
      z.union([
        z.string(),
        z.object({
          repositoryId: z.string(),
          tagName: z.string(),
        }),
      ])
    )
    .optional(),
  linearIssueIds: z
    .array(
      z.object({
        integrationId: z.string(),
        issueId: z.string(),
      })
    )
    .optional(),
});

export type SelectedItems = z.infer<typeof selectedItemsSchema> | undefined;

export const createOnDemandContentSchema = z.object({
  contentType: onDemandContentTypeSchema,
  lookbackWindow: z.enum(LOOKBACK_WINDOWS).default("last_7_days"),
  brandVoiceId: z.string().min(1).optional(),
  repositoryIds: z.array(z.string().min(1)).optional(),
  linearIntegrationIds: z.array(z.string().min(1)).optional(),
  dataPoints: contentDataPointSettingsSchema.prefault({}),
  selectedItems: selectedItemsSchema.optional(),
});

export type CreateOnDemandContentInput = z.infer<
  typeof createOnDemandContentSchema
>;
