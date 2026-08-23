import {
  isTinybirdConfigured,
  querySocialOverview,
} from "@notra/analytics/tinybird/client";
import { defineTool } from "eve/tools";
import {
  ANALYTICS_NOT_CONFIGURED_MESSAGE,
  ANALYTICS_QUERY_FAILED_MESSAGE,
} from "../constants/analytics";
import { getSocialAnalyticsOverviewInputSchema } from "../schemas/analytics-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetSocialAnalyticsOverviewTool() {
  return defineTool({
    description:
      "Get live social analytics for the organization's connected Twitter/X and LinkedIn accounts. Returns one row per account with follower count, number of tracked posts, and lifetime impressions, likes, replies, and reposts. Use when the user asks how their social accounts are performing, how many followers they have, or before advising on content strategy.",
    inputSchema: getSocialAnalyticsOverviewInputSchema,
    async execute(_input, ctx) {
      const organizationId = requireOrganizationId(ctx);

      if (!isTinybirdConfigured()) {
        return ANALYTICS_NOT_CONFIGURED_MESSAGE;
      }

      try {
        const result = await querySocialOverview({
          organization_id: organizationId,
        });

        if (!result) {
          return ANALYTICS_NOT_CONFIGURED_MESSAGE;
        }

        return {
          accounts: result.data.map((row) => ({
            provider: row.provider,
            username: row.username,
            followers_count: row.followers_count,
            tracked_posts: row.tracked_posts,
            impressions: row.impressions,
            likes: row.likes,
            replies: row.replies,
            reposts: row.reposts,
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
