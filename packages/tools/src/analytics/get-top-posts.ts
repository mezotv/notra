import {
  isTinybirdConfigured,
  queryTopPosts,
} from "@notra/analytics/tinybird/client";
import { defineTool } from "eve/tools";

import {
  ANALYTICS_NOT_CONFIGURED_MESSAGE,
  ANALYTICS_QUERY_FAILED_MESSAGE,
} from "../constants/analytics";
import { getTopPostsInputSchema } from "../schemas/analytics-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetTopPostsTool() {
  return defineTool({
    description:
      "Get the organization's best performing social posts, ranked by live engagement. Returns each post's content, url, posted_at, likes, replies, reposts, impressions, and total engagement. Use to learn what actually resonates with the audience before writing new content.",
    inputSchema: getTopPostsInputSchema,
    async execute({ limit }, ctx) {
      const organizationId = requireOrganizationId(ctx);

      if (!isTinybirdConfigured()) {
        return ANALYTICS_NOT_CONFIGURED_MESSAGE;
      }

      try {
        const result = await queryTopPosts({
          organization_id: organizationId,
          limit,
        });

        if (!result) {
          return ANALYTICS_NOT_CONFIGURED_MESSAGE;
        }

        return {
          posts: result.data.map((row) => ({
            provider: row.provider,
            content: row.content,
            url: row.url,
            posted_at: row.posted_at,
            likes: row.likes,
            replies: row.replies,
            reposts: row.reposts,
            impressions: row.impressions,
            engagement: row.engagement,
          })),
        };
      } catch (error) {
        return `${ANALYTICS_QUERY_FAILED_MESSAGE} ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
}
