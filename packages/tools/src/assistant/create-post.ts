import { type ContentType, contentTypeSchema } from "@notra/ai/schemas/content";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import {
  createPostRecord,
  ensureChatPostCollection,
} from "@notra/ai/utils/post-service";
import { defineTool } from "eve/tools";
import {
  createPostInputSchema,
  createPostWithSlugInputSchema,
} from "../schemas/assistant-tools";
import { deriveDeterministicPostId } from "../utils/idempotency";
import { requireOrganizationId } from "../utils/organization";
import { getSessionAttribute } from "../utils/session";

export function createCreatePostTool(contentType: ContentType) {
  const parsedContentType = contentTypeSchema.parse(contentType);
  const withSlug = supportsPostSlug(parsedContentType);

  return defineTool({
    description: `Creates a new ${parsedContentType} post in the database with the generated content and saves it as a draft. Use after you have finished writing the post. Requires a title (plain text, max 120 chars) and a markdown content body. Call it multiple times only when there are multiple meaningfully distinct posts to save.`,
    inputSchema: withSlug
      ? createPostWithSlugInputSchema
      : createPostInputSchema,
    approval: (ctx) =>
      getSessionAttribute(ctx, "surface") === "task"
        ? "approved"
        : "user-approval",
    async execute(input, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const surface = getSessionAttribute(ctx, "surface");
      if (surface === "content-editor") {
        throw new Error(
          "Creating new posts is not available in the content editor. Edit the current document instead."
        );
      }
      const slug = withSlug
        ? (createPostWithSlugInputSchema.parse(input).slug ?? null)
        : null;
      const chatId = getSessionAttribute(ctx, "chatId");
      const collectionId = await ensureChatPostCollection({
        organizationId,
        chatId,
        contentType: parsedContentType,
      });
      const { postId, deduplicated } = await createPostRecord({
        organizationId,
        collectionId,
        contentType: parsedContentType,
        title: input.title,
        slug,
        markdown: input.markdown,
        recommendations: input.recommendations ?? null,
        sourceMetadata: chatId ? { chatId } : null,
        postId: deriveDeterministicPostId(
          ctx,
          `create_post:${parsedContentType}:${input.title} ${input.markdown}`
        ),
      });
      return {
        postId,
        status: "created",
        deduplicated,
        contentType: parsedContentType,
      };
    },
  });
}
