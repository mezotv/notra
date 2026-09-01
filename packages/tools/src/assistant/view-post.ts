import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";

import { viewPostInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createViewPostTool() {
  return defineTool({
    description:
      "Retrieves an existing post's content by ID. Use it to review a post that was already created before making updates. Returns the post title, markdown content, and metadata.",
    inputSchema: viewPostInputSchema,
    async execute({ postId }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const post = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId)
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
