import {
  queryGeoCheckCompetitorShare,
  queryGeoCheckOverview,
  toGeoCheckWindow,
} from "@notra/db/utils/geo-checks";
import { defineTool } from "eve/tools";
import { ANALYTICS_QUERY_FAILED_MESSAGE } from "../constants/analytics";
import { getGeoOverviewInputSchema } from "../schemas/analytics-tools";
import { requireOrganizationId } from "../utils/organization";

const COMPETITOR_LIMIT = 10;

export function createGetGeoOverviewTool() {
  return defineTool({
    description:
      "Get the organization's GEO (AI visibility) status: how often AI engines like ChatGPT, Claude, and Gemini mention the company when asked relevant questions, per engine mention rate, average position, and the competitor brands engines recommend instead. Use to inform content strategy that improves AI visibility.",
    inputSchema: getGeoOverviewInputSchema,
    async execute({ days }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      // GEO mention checks live in Postgres (all projects of the org).
      const scope = { organizationId, projectId: null };

      try {
        const window = toGeoCheckWindow({ days });
        const [overview, competitors] = await Promise.all([
          queryGeoCheckOverview(scope, window),
          queryGeoCheckCompetitorShare(scope, window, COMPETITOR_LIMIT),
        ]);

        return {
          engines: overview.map((row) => ({
            engine: row.engine,
            checks: row.checks,
            mentions: row.mentions,
            mention_rate: row.mentionRate,
            avg_position: row.avgPosition,
          })),
          competitor_share: competitors.map((row) => ({
            brand: row.brand,
            mentions: row.mentions,
          })),
        };
      } catch (error) {
        console.error("[Tools] GEO overview failed:", error);
        return ANALYTICS_QUERY_FAILED_MESSAGE;
      }
    },
  });
}
