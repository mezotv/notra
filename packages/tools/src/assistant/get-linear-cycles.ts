import { getLinearToolContextByIntegrationId } from "@notra/ai/integrations/linear";
import { createLinearClient } from "@notra/ai/utils/linear";
import { defineTool } from "eve/tools";
import { getLinearCyclesInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetLinearCyclesTool() {
  return defineTool({
    description:
      "Get recent Linear cycles for a team (name, progress, timeline). Returns the most recent cycles including the active one. Requires a connected Linear integration.",
    inputSchema: getLinearCyclesInputSchema,
    async execute({ integrationId }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const resolved = await getLinearToolContextByIntegrationId(
        integrationId,
        { organizationId }
      );
      const client = createLinearClient(resolved.accessToken);

      if (!resolved.linearTeamId) {
        return {
          cycles: [],
          note: "No team scoped for this integration. Cycles are team-specific in Linear.",
        };
      }

      const team = await client.team(resolved.linearTeamId);
      const cycles = await team.cycles({
        first: 5,
        orderBy: "startsAt" as never,
      });

      const results = cycles.nodes.map((cycle) => ({
        id: cycle.id,
        name: cycle.name ?? null,
        number: cycle.number,
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
        progress: cycle.progress,
        completedAt: cycle.completedAt ?? null,
      }));

      return { cycles: results };
    },
  });
}
