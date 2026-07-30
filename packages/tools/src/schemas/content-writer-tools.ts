import { contentTypeSchema } from "@notra/ai/schemas/content";
import { POST_SLUG_MAX_LENGTH, POST_SLUG_REGEX } from "@notra/ai/schemas/post";
import { z } from "zod";

const POST_TITLE_MAX_LENGTH = 120;

export const writerCreatePostInputSchema = z.object({
  title: z
    .string()
    .max(POST_TITLE_MAX_LENGTH)
    .describe("The post title, plain text without markdown"),
  markdown: z
    .string()
    .describe(
      "The full post content body as markdown/MDX, without the title heading"
    ),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(POST_SLUG_MAX_LENGTH)
    .regex(
      POST_SLUG_REGEX,
      "Slug must contain lowercase letters, numbers, and hyphens only"
    )
    .nullable()
    .optional()
    .default(null)
    .describe(
      "Optional URL slug for blog posts and changelogs. Use lowercase letters, numbers, and hyphens."
    ),
  recommendations: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Optional actionable publishing recommendations as markdown: best time to post, audience targeting, distribution channels, or cross-posting ideas"
    ),
  contentType: contentTypeSchema
    .optional()
    .describe(
      "The content type to create. Only used when the task configuration does not already pin a content type."
    ),
});
