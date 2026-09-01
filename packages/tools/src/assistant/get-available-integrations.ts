import type { AvailableGitHubIntegration } from "@notra/ai/types/organization";
import {
  isAvailableGitHubIntegration,
  isAvailableGranolaIntegration,
  isAvailableLinearIntegration,
  serializeAvailableGitHubIntegration,
  serializeAvailableGranolaIntegration,
  serializeAvailableLinearIntegration,
  toAvailableGitHubIntegration,
} from "@notra/ai/utils/organization";
import { db } from "@notra/db/drizzle";
import {
  githubIntegrations,
  granolaIntegrations,
  linearIntegrations,
} from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";

import { getAvailableIntegrationsInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetAvailableIntegrationsTool() {
  return defineTool({
    description:
      "Lists the organization's available integrations, including only enabled integrations and enabled repositories. Returns enabled GitHub, Linear, and Granola integrations with the integrationId to use in the matching data tools.",
    inputSchema: getAvailableIntegrationsInputSchema,
    async execute(_input, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const [github, linear, granola] = await Promise.all([
        db.query.githubIntegrations.findMany({
          where: eq(githubIntegrations.organizationId, organizationId),
          orderBy: [desc(githubIntegrations.createdAt)],
        }),
        db.query.linearIntegrations.findMany({
          where: eq(linearIntegrations.organizationId, organizationId),
          orderBy: [desc(linearIntegrations.createdAt)],
        }),
        db.query.granolaIntegrations.findMany({
          where: eq(granolaIntegrations.organizationId, organizationId),
          orderBy: [desc(granolaIntegrations.createdAt)],
        }),
      ]);

      const availableGithub: AvailableGitHubIntegration[] = github
        .filter(isAvailableGitHubIntegration)
        .map(toAvailableGitHubIntegration)
        .filter(
          (integration): integration is AvailableGitHubIntegration =>
            integration !== null
        );
      const availableLinear = linear.filter(isAvailableLinearIntegration);
      const availableGranola = granola.filter(isAvailableGranolaIntegration);

      return {
        integrations: {
          github: availableGithub.map(serializeAvailableGitHubIntegration),
          linear: availableLinear.map(serializeAvailableLinearIntegration),
          granola: availableGranola.map(serializeAvailableGranolaIntegration),
        },
        counts: {
          github: availableGithub.length,
          linear: availableLinear.length,
          granola: availableGranola.length,
          total:
            availableGithub.length +
            availableLinear.length +
            availableGranola.length,
        },
      };
    },
  });
}
