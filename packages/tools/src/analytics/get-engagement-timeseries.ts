import {
  isTinybirdConfigured,
  queryEngagementTimeseries,
} from "@notra/analytics/tinybird/client";
import { defineTool } from "eve/tools";

import {
  ANALYTICS_NOT_CONFIGURED_MESSAGE,
  ANALYTICS_QUERY_FAILED_MESSAGE,
} from "../constants/analytics";
import { getEngagementTimeseriesInputSchema } from "../schemas/analytics-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetEngagementTimeseriesTool() {
  return defineTool({
    description:
      "Get the daily social engagement timeseries for the organization's connected Twitter/X and LinkedIn accounts. Returns one row per day and account with posts, impressions, likes, replies, and reposts. Use to spot trends, growth, or drops over time.",
    inputSchema: getEngagementTimeseriesInputSchema,
    async execute({ days }, ctx) {
      const organizationId = requireOrganizationId(ctx);

      if (!isTinybirdConfigured()) {
        return ANALYTICS_NOT_CONFIGURED_MESSAGE;
      }

      try {
        const result = await queryEngagementTimeseries({
          organization_id: organizationId,
          days,
        });

        if (!result) {
          return ANALYTICS_NOT_CONFIGURED_MESSAGE;
        }

        return { days, timeseries: result.data };
      } catch (error) {
        return `${ANALYTICS_QUERY_FAILED_MESSAGE} ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
}
