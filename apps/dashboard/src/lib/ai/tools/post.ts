import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, eq } from "drizzle-orm";
import { marked } from "marked";
import { customAlphabet } from "nanoid";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { sanitizeMarkdownHtml } from "@/lib/sanitize";
import { contentTypeSchema } from "@/schemas/content";
import type { PostToolsConfig, PostToolsResult } from "@/types/ai/post-tools";
import { toolDescription } from "@/utils/ai/description";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

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
        "After you have finished writing a post and are ready to save it.",
      usageNotes:
        "Requires a title (plain text, max 120 chars) and markdown content body. You may call this multiple times only when there are multiple meaningfully distinct posts to save.",
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
      const id = nanoid();
      const content = sanitizeMarkdownHtml(await marked.parse(markdown));
      await db.insert(posts).values({
        id,
        organizationId: config.organizationId,
        title,
        content,
        markdown,
        contentType,
        sourceMetadata: config.sourceMetadata ?? null,
      });
      result.posts ??= [];
      result.posts.push({ postId: id, title });
      result.postId ??= id;
      result.title ??= title;
      return {
        postId: id,
        status: "created",
        totalCreated: result.posts.length,
      };
    },
  });
}

export function createUpdatePostTool(
  config: PostToolsConfig,
  result: PostToolsResult
): Tool {
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
        updates.content = sanitizeMarkdownHtml(await marked.parse(markdown));
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

      if (title !== undefined) {
        const existingPost = result.posts?.find(
          (entry) => entry.postId === postId
        );
        if (existingPost) {
          existingPost.title = title;
        }

        if (result.postId === postId) {
          result.title = title;
        }
      }

      return { postId, status: "updated" };
    },
  });
}

export function createFailTool(result: PostToolsResult): Tool {
  return tool({
    description: toolDescription({
      toolName: "fail",
      intro: "Signals that you cannot complete the task and provides a reason.",
      whenToUse:
        "When you determine that you cannot generate meaningful content, for example if there are no changes, no data available, or the request is impossible to fulfill.",
      usageNotes:
        "Provide a concise 1-2 sentence reason explaining why you cannot complete the task. This reason will be shown to the user.",
    }),
    inputSchema: z.object({
      reason: z
        .string()
        .max(300)
        .describe(
          "A concise 1-2 sentence explanation of why the task cannot be completed"
        ),
    }),
    execute: async ({ reason }) => {
      result.failReason = reason;
      return { status: "failed", reason };
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
