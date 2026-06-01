import { contentTypeSchema } from "@notra/ai/schemas/content";
import {
  POST_SLUG_MAX_LENGTH,
  POST_SLUG_REGEX,
  supportsPostSlug,
} from "@notra/ai/schemas/post";
import type {
  PostToolsConfig,
  PostToolsResult,
} from "@notra/ai/types/post-tools";
import type { PostToolConfig } from "@notra/ai/types/posts";
import { toolDescription } from "@notra/ai/utils/description";
import {
  serializeAvailablePost,
  serializePostDetail,
} from "@notra/ai/utils/posts";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { db } from "@notra/db/drizzle";
import { postCollections, posts } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, eq, sql } from "drizzle-orm";
import { marked } from "marked";
import { customAlphabet } from "nanoid";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

const CREATE_POST_TOOL_NAMES = {
  changelog: "createChangelog",
  blog_post: "createBlogPost",
  twitter_post: "createTwitterPost",
  linkedin_post: "createLinkedInPost",
  investor_update: "createInvestorUpdate",
  image: "createImage",
} as const;

export function getCreatePostToolName(contentType: string): string {
  return (
    CREATE_POST_TOOL_NAMES[
      contentType as keyof typeof CREATE_POST_TOOL_NAMES
    ] ?? "createPost"
  );
}

const postSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(POST_SLUG_MAX_LENGTH)
  .regex(
    POST_SLUG_REGEX,
    "Slug must contain lowercase letters, numbers, and hyphens only"
  );

export function createCreatePostTool(
  config: PostToolsConfig,
  result: PostToolsResult
): Tool {
  const contentType = contentTypeSchema.parse(config.contentType);
  const toolName = getCreatePostToolName(contentType);

  if (supportsPostSlug(contentType)) {
    return tool({
      description: toolDescription({
        toolName,
        intro:
          "Creates a new post in the database with the generated content. The post type and source repositories are set automatically.",
        whenToUse:
          "After you have finished writing a post and are ready to save it.",
        usageNotes:
          "Requires a title (plain text, max 120 chars) and markdown content body. You may call this multiple times only when there are multiple meaningfully distinct posts to save.",
      }),
      needsApproval: config.needsApproval ?? false,
      inputSchema: z.object({
        title: z
          .string()
          .max(120)
          .describe("The post title, plain text without markdown"),
        slug: postSlugSchema
          .nullable()
          .optional()
          .default(null)
          .describe(
            "Optional URL slug for blog posts and changelogs. Use lowercase letters, numbers, and hyphens."
          ),
        markdown: z
          .string()
          .describe(
            "The full post content body as markdown/MDX, without the title heading"
          ),
        recommendations: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Optional actionable publishing recommendations as markdown — best time to post, audience targeting, distribution channels, or cross-posting ideas"
          ),
      }),
      execute: async ({ title, slug, markdown, recommendations }) => {
        if (!config.collectionId) {
          throw new Error("Post collection is required to create a post.");
        }

        const collectionId = config.collectionId;
        const id = nanoid();
        const content = sanitizeMarkdownHtml(await marked.parse(markdown));
        await db.transaction(async (tx) => {
          await tx.insert(posts).values({
            id,
            organizationId: config.organizationId,
            collectionId,
            title,
            slug,
            content,
            markdown,
            recommendations: recommendations ?? null,
            contentType,
            status: config.autoPublish ? "published" : "draft",
            sourceMetadata: config.sourceMetadata ?? null,
          });
          await tx
            .update(postCollections)
            .set({
              completedPostCount: sql`${postCollections.completedPostCount} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(postCollections.id, collectionId),
                eq(postCollections.organizationId, config.organizationId)
              )
            );
        });
        result.posts ??= [];
        result.posts.push({
          postId: id,
          title,
          recommendations: recommendations ?? null,
        });
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

  return tool({
    description: toolDescription({
      toolName,
      intro:
        "Creates a new post in the database with the generated content. The post type and source repositories are set automatically.",
      whenToUse:
        "After you have finished writing a post and are ready to save it.",
      usageNotes:
        "Requires a title (plain text, max 120 chars) and markdown content body. You may call this multiple times only when there are multiple meaningfully distinct posts to save.",
    }),
    needsApproval: config.needsApproval ?? false,
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
      recommendations: z
        .string()
        .nullable()
        .optional()
        .describe(
          "Optional actionable publishing recommendations as markdown — best time to post, audience targeting, distribution channels, or cross-posting ideas"
        ),
    }),
    execute: async ({ title, markdown, recommendations }) => {
      if (!config.collectionId) {
        throw new Error("Post collection is required to create a post.");
      }

      const collectionId = config.collectionId;
      const id = nanoid();
      const content = sanitizeMarkdownHtml(await marked.parse(markdown));
      await db.transaction(async (tx) => {
        await tx.insert(posts).values({
          id,
          organizationId: config.organizationId,
          collectionId,
          title,
          slug: null,
          content,
          markdown,
          recommendations: recommendations ?? null,
          contentType,
          status: config.autoPublish ? "published" : "draft",
          sourceMetadata: config.sourceMetadata ?? null,
        });
        await tx
          .update(postCollections)
          .set({
            completedPostCount: sql`${postCollections.completedPostCount} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(postCollections.id, collectionId),
              eq(postCollections.organizationId, config.organizationId)
            )
          );
      });
      result.posts ??= [];
      result.posts.push({
        postId: id,
        title,
        recommendations: recommendations ?? null,
      });
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
  if (supportsPostSlug(config.contentType)) {
    return tool({
      description: toolDescription({
        toolName: "updatePost",
        intro: "Updates an existing post's title and/or content.",
        whenToUse:
          "When you need to revise a post that was already created via one of the create post tools.",
        usageNotes:
          "Requires the postId returned from a create post tool. Provide only the fields you want to change.",
      }),
      inputSchema: z.object({
        postId: z.string().describe("The ID of the post to update"),
        title: z
          .string()
          .max(120)
          .optional()
          .describe("Updated title, plain text without markdown"),
        slug: postSlugSchema
          .nullable()
          .optional()
          .describe(
            "Updated optional URL slug for blog posts and changelogs. Pass null to clear it."
          ),
        markdown: z
          .string()
          .optional()
          .describe("Updated content body as markdown/MDX"),
        recommendations: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Updated optional recommendations as markdown. Pass null to clear them."
          ),
      }),
      execute: async ({ postId, title, slug, markdown, recommendations }) => {
        const updates: Record<string, string | null> = {};
        if (title !== undefined) {
          updates.title = title;
        }
        if (slug !== undefined) {
          updates.slug = slug;
        }
        if (markdown !== undefined) {
          updates.content = sanitizeMarkdownHtml(await marked.parse(markdown));
          updates.markdown = markdown;
        }
        if (recommendations !== undefined) {
          updates.recommendations = recommendations;
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

        if (recommendations !== undefined) {
          const existingPost = result.posts?.find(
            (entry) => entry.postId === postId
          );
          if (existingPost) {
            existingPost.recommendations = recommendations;
          }
        }

        return { postId, status: "updated" };
      },
    });
  }

  return tool({
    description: toolDescription({
      toolName: "updatePost",
      intro: "Updates an existing post's title and/or content.",
      whenToUse:
        "When you need to revise a post that was already created via one of the create post tools.",
      usageNotes:
        "Requires the postId returned from a create post tool. Provide only the fields you want to change.",
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
      recommendations: z
        .string()
        .nullable()
        .optional()
        .describe(
          "Updated optional recommendations as markdown. Pass null to clear them."
        ),
    }),
    execute: async ({ postId, title, markdown, recommendations }) => {
      const updates: Record<string, string | null> = {};
      if (title !== undefined) {
        updates.title = title;
      }
      if (markdown !== undefined) {
        updates.content = sanitizeMarkdownHtml(await marked.parse(markdown));
        updates.markdown = markdown;
      }
      if (recommendations !== undefined) {
        updates.recommendations = recommendations;
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

      if (recommendations !== undefined) {
        const existingPost = result.posts?.find(
          (entry) => entry.postId === postId
        );
        if (existingPost) {
          existingPost.recommendations = recommendations;
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
        "When an actual error, invalid input, tool/API failure, or impossible request prevents generation. Do not use this for expected no-op cases with no meaningful source material; use skip instead.",
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

export function createSkipTool(result: PostToolsResult): Tool {
  return tool({
    description: toolDescription({
      toolName: "skip",
      intro:
        "Signals that generation should be skipped because there is no meaningful source material.",
      whenToUse:
        "When source lookup succeeds but there are no commits, pull requests, releases, Linear issues, or other meaningful changes worth turning into content.",
      usageNotes:
        "Use this instead of fail for expected no-op cases. Provide a concise 1-2 sentence reason that can be shown in workflow logs.",
    }),
    inputSchema: z.object({
      reason: z
        .string()
        .max(300)
        .describe(
          "A concise 1-2 sentence explanation of why generation was skipped"
        ),
    }),
    execute: async ({ reason }) => {
      result.skipReason = reason;
      return { status: "skipped", reason };
    },
  });
}

export function createViewPostTool(config: PostToolsConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "viewPost",
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
        slug: post.slug,
        markdown: post.markdown,
        recommendations: post.recommendations,
        contentType: post.contentType,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    },
  });
}

export function createGetAvailablePostsTool(config: PostToolConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "getAvailablePosts",
      intro: "Lists recent posts for the organization.",
      whenToUse:
        "Use when the user asks what posts already exist, which drafts are available, or what has been published recently.",
      usageNotes:
        "You can optionally filter by content type or status, and control how many recent posts are returned.",
    }),
    inputSchema: z.object({
      limit: z.number().int().min(1).max(50).optional().default(10),
      contentType: z.string().optional(),
      status: z.enum(["draft", "published"]).optional(),
    }),
    execute: async ({ limit, contentType, status }) => {
      const postList = await db.query.posts.findMany({
        where: (table, operators) => {
          const filters = [eq(table.organizationId, config.organizationId)];

          if (contentType) {
            filters.push(eq(table.contentType, contentType));
          }

          if (status) {
            filters.push(eq(table.status, status));
          }

          return operators.and(...filters);
        },
        orderBy: (table, operators) => [operators.desc(table.createdAt)],
        limit,
      });

      return {
        posts: postList.map(serializeAvailablePost),
        count: postList.length,
      };
    },
  });
}

export function createGetPostByIdTool(config: PostToolConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "getPostById",
      intro: "Gets one existing post by ID.",
      whenToUse:
        "Use when the user asks for details or content of a specific existing post.",
      usageNotes:
        "Pass a post id from getAvailablePosts or from prior context. Returns markdown and post metadata.",
    }),
    inputSchema: z.object({
      postId: z.string().describe("The ID of the post to fetch"),
    }),
    execute: async ({ postId }) => {
      const post = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, postId),
          eq(posts.organizationId, config.organizationId)
        ),
      });

      if (!post) {
        return { post: null, found: false };
      }

      return {
        post: serializePostDetail(post),
        found: true,
      };
    },
  });
}
