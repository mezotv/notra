import {
  isTinybirdConfigured,
  queryGeoCompetitorShare,
  queryGeoOverview,
} from "@notra/analytics/tinybird/client";
import { defineTool } from "eve/tools";
import {
  ANALYTICS_NOT_CONFIGURED_MESSAGE,
  ANALYTICS_QUERY_FAILED_MESSAGE,
} from "../constants/analytics";
import { getGeoOverviewInputSchema } from "../schemas/analytics-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetGeoOverviewTool() {
  return defineTool({
    description:
      "Get the organization's GEO (AI visibility) status: how often AI engines like ChatGPT, Claude, and Gemini mention the company when asked relevant questions, per engine mention rate, average position, and the competitor brands engines recommend instead. Use to inform content strategy that improves AI visibility.",
    inputSchema: getGeoOverviewInputSchema,
    async execute({ days }, ctx) {
      const organizationId = requireOrganizationId(ctx);

      if (!isTinybirdConfigured()) {
        return ANALYTICS_NOT_CONFIGURED_MESSAGE;
      }

      try {
        const [overview, competitors] = await Promise.all([
          queryGeoOverview({ organization_id: organizationId, days }),
          queryGeoCompetitorShare({
            organization_id: organizationId,
            days,
            limit: 10,
          }),
        ]);

        if (!overview) {
          return ANALYTICS_NOT_CONFIGURED_MESSAGE;
        }

        return {
          engines: overview.data.map((row) => ({
            engine: row.engine,
            checks: Number(row.checks),
            mentions: Number(row.mentions),
            mention_rate: row.mention_rate,
            avg_position: row.avg_position,
          })),
          competitor_share: (competitors?.data ?? []).map((row) => ({
            brand: row.brand,
            mentions: Number(row.mentions),
          })),
        };
      } catch (error) {
        console.error("[Tools] GEO overview failed:", error);
        return ANALYTICS_QUERY_FAILED_MESSAGE;
      }
    },
  });
}
