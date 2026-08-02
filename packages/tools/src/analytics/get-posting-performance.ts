import {
  isTinybirdConfigured,
  queryPostingPerformance,
} from "@notra/analytics/tinybird/client";
import { defineTool } from "eve/tools";
import {
  ANALYTICS_NOT_CONFIGURED_MESSAGE,
  ANALYTICS_QUERY_FAILED_MESSAGE,
} from "../constants/analytics";
import { getPostingPerformanceInputSchema } from "../schemas/analytics-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetPostingPerformanceTool() {
  return defineTool({
    description:
      "Get social posting performance broken down by weekday (1 = Monday through 7 = Sunday), with posts, total engagement, and avg_engagement per weekday. Use to advise on the best days to post.",
    inputSchema: getPostingPerformanceInputSchema,
    async execute({ days }, ctx) {
      const organizationId = requireOrganizationId(ctx);

      if (!isTinybirdConfigured()) {
        return ANALYTICS_NOT_CONFIGURED_MESSAGE;
      }

      try {
        const result = await queryPostingPerformance({
          organization_id: organizationId,
          days,
        });

        if (!result) {
          return ANALYTICS_NOT_CONFIGURED_MESSAGE;
        }

        return { days, weekdays: result.data };
      } catch (error) {
        return `${ANALYTICS_QUERY_FAILED_MESSAGE} ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
  });
}
