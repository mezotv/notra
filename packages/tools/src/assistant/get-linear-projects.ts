import { getLinearToolContextByIntegrationId } from "@notra/ai/integrations/linear";
import { createLinearClient } from "@notra/ai/utils/linear";
import { defineTool } from "eve/tools";
import { getLinearProjectsInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetLinearProjectsTool() {
  return defineTool({
    description:
      "Get Linear projects (name, description, state, progress, timeline). Set includeCompleted to include finished projects. Requires a connected Linear integration.",
    inputSchema: getLinearProjectsInputSchema,
    async execute({ integrationId, includeCompleted }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const resolved = await getLinearToolContextByIntegrationId(
        integrationId,
        { organizationId }
      );
      const client = createLinearClient(resolved.accessToken);

      const filter: Record<string, unknown> = {};
      if (resolved.linearTeamId) {
        filter.accessibleTeams = {
          some: { id: { eq: resolved.linearTeamId } },
        };
      }
      if (!includeCompleted) {
        filter.state = { type: { nin: ["completed", "canceled"] } };
      }

      const projects = await client.projects({
        filter,
        first: 25,
        orderBy: "updatedAt" as never,
      });

      const results = await Promise.all(
        projects.nodes.map(async (project) => {
          const lead = await project.lead;
          return {
            id: project.id,
            name: project.name,
            description: project.description
              ? project.description.slice(0, 300)
              : null,
            state: project.state,
            progress: project.progress,
            startDate: project.startDate ?? null,
            targetDate: project.targetDate ?? null,
            lead: lead?.name ?? lead?.displayName ?? null,
            url: project.url,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          };
        })
      );

      return { projects: results };
    },
  });
}
