import { serializeAvailablePost } from "@notra/ai/utils/posts";
import { db } from "@notra/db/drizzle";
import { eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { getAvailablePostsInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetAvailablePostsTool() {
  return defineTool({
    description:
      "Lists recent posts for the organization. Use when the user asks what posts already exist, which drafts are available, or what has been published recently. Optionally filter by content type or status.",
    inputSchema: getAvailablePostsInputSchema,
    async execute({ limit, contentType, status }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const postList = await db.query.posts.findMany({
        where: (table, operators) => {
          const filters = [eq(table.organizationId, organizationId)];
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
