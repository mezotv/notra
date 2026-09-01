import { contentTypeSchema } from "@notra/ai/schemas/content";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import {
  createPostRecord,
  ensureChatPostCollection,
} from "@notra/ai/utils/post-service";
import type { PostSourceMetadata } from "@notra/db/schema";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { writerCreatePostInputSchema } from "../schemas/content-writer-tools";
import { deriveDeterministicPostId } from "../utils/idempotency";
import { requireOrganizationId } from "../utils/organization";
import {
  getBooleanSessionAttribute,
  getJsonSessionAttribute,
  getSessionAttribute,
} from "../utils/session";

export function createWriterCreatePostTool() {
  return defineTool({
    description:
      "Creates the generated post in the database. The collection, publish status, and source metadata come from the trusted task configuration when present. Use after you have finished writing the post. Requires a title (plain text, max 120 chars) and a markdown content body. Call it multiple times only when there are multiple meaningfully distinct posts to save.",
    inputSchema: writerCreatePostInputSchema,
    async execute(input, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const configuredContentType = getSessionAttribute(ctx, "contentType");
      const contentType = contentTypeSchema.parse(
        configuredContentType ?? input.contentType
      );
      const configuredCollectionId = getSessionAttribute(ctx, "collectionId");
      const collectionId =
        configuredCollectionId ??
        (await ensureChatPostCollection({
          organizationId,
          chatId: getSessionAttribute(ctx, "chatId"),
          contentType,
        }));
      const autoPublish = getBooleanSessionAttribute(ctx, "autoPublish");
      const sourceMetadata = getJsonSessionAttribute(
        ctx,
        "sourceMetadata",
        (value) => z.custom<PostSourceMetadata>().parse(value)
      );

      const { postId, deduplicated } = await createPostRecord({
        organizationId,
        collectionId,
        contentType,
        title: input.title,
        slug: supportsPostSlug(contentType) ? (input.slug ?? null) : null,
        markdown: input.markdown,
        recommendations: input.recommendations ?? null,
        autoPublish,
        sourceMetadata,
        postId: deriveDeterministicPostId(
          ctx,
          `create_post:${contentType}:${input.title} ${input.markdown}`
        ),
      });

      return { postId, status: "created", deduplicated, contentType };
    },
  });
}
