import { serializePostDetail } from "@notra/ai/utils/posts";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { and, eq, or } from "drizzle-orm";
import { defineTool } from "eve/tools";

import { getPostInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetPostTool() {
  return defineTool({
    description:
      "Gets one existing post by ID, slug, or exact title. Use when the user asks for details or content of a specific existing post. Returns markdown and post metadata.",
    inputSchema: getPostInputSchema,
    async execute({ identifier }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const post = await db.query.posts.findFirst({
        where: and(
          or(
            eq(posts.id, identifier),
            eq(posts.slug, identifier),
            eq(posts.title, identifier)
          ),
          eq(posts.organizationId, organizationId)
        ),
      });

      if (!post) {
        return { post: null, found: false };
      }

      return { post: serializePostDetail(post), found: true };
    },
  });
}
