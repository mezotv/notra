import { db } from "@notra/db/drizzle";
import type { PostSourceMetadata } from "@notra/db/schema";
import { posts } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, eq } from "drizzle-orm";
import { marked } from "marked";
import { customAlphabet } from "nanoid";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { type ContentType, contentTypeSchema } from "@/schemas/content";
import { toolDescription } from "@/utils/ai/description";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export interface PostToolsConfig {
  organizationId: string;
  contentType: ContentType;
  sourceMetadata?: PostSourceMetadata;
}

export interface PostToolsResult {
  postId?: string;
  title?: string;
}

export function createCreatePostTool(
  config: PostToolsConfig,
  result: PostToolsResult
): Tool {
  const contentType = contentTypeSchema.parse(config.contentType);

  return tool({
    description: toolDescription({
      toolName: "create_post",
      intro:
        "Creates a new post in the database with the generated content. The post type and source repositories are set automatically.",
      whenToUse:
        "After you have finished writing the changelog content and are ready to save it.",
      usageNotes:
        "Requires a title (plain text, max 120 chars) and markdown content body. Call this exactly once when the content is finalized.",
    }),
    inputSchema: z.object({
      title: z
        .string()
        .max(120)
        .describe("The post title, plain text without markdown"),
      markdown: z
        .string()
        .describe(
          "The full post content body as markdown/MDX, without the title heading"
        ),
    }),
    execute: async ({ title, markdown }) => {
      if (result.postId) {
        return {
          postId: result.postId,
          status: "already_created",
          message: "Post already created. Use updatePost to modify it.",
        };
      }
      const id = nanoid();
      const content = await marked.parse(markdown);
      await db.insert(posts).values({
        id,
        organizationId: config.organizationId,
        title,
        content,
        markdown,
        contentType,
        sourceMetadata: config.sourceMetadata ?? null,
      });
      result.postId = id;
      result.title = title;
      return { postId: id, status: "created" };
    },
  });
}

export function createUpdatePostTool(config: PostToolsConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "update_post",
      intro: "Updates an existing post's title and/or content.",
      whenToUse:
        "When you need to revise a post that was already created via create_post.",
      usageNotes:
        "Requires the postId returned from create_post. Provide only the fields you want to change.",
    }),
    inputSchema: z.object({
      postId: z.string().describe("The ID of the post to update"),
      title: z
        .string()
        .max(120)
        .optional()
        .describe("Updated title, plain text without markdown"),
      markdown: z
        .string()
        .optional()
        .describe("Updated content body as markdown/MDX"),
    }),
    execute: async ({ postId, title, markdown }) => {
      const updates: Record<string, string> = {};
      if (title !== undefined) {
        updates.title = title;
      }
      if (markdown !== undefined) {
        updates.content = await marked.parse(markdown);
        updates.markdown = markdown;
      }

      if (Object.keys(updates).length === 0) {
        return { postId, status: "no_changes" };
      }

      const rows = await db
        .update(posts)
        .set(updates)
        .where(
          and(
            eq(posts.id, postId),
            eq(posts.organizationId, config.organizationId)
          )
        )
        .returning({ id: posts.id });

      if (rows.length === 0) {
        return { postId, status: "not_found" };
      }

      return { postId, status: "updated" };
    },
  });
}

export function createViewPostTool(config: PostToolsConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "view_post",
      intro: "Retrieves an existing post's content by ID.",
      whenToUse:
        "When you need to review a post that was already created before making updates.",
      usageNotes: "Returns the post title, markdown content, and metadata.",
    }),
    inputSchema: z.object({
      postId: z.string().describe("The ID of the post to view"),
    }),
    execute: async ({ postId }) => {
      const post = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, postId),
          eq(posts.organizationId, config.organizationId)
        ),
      });

      if (!post) {
        return { error: "Post not found" };
      }

      return {
        postId: post.id,
        title: post.title,
        markdown: post.markdown,
        contentType: post.contentType,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    },
  });
}
