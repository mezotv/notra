import type { IntegrationType } from "@/schemas/integrations";
import type {
  IntegrationFetcher,
  IntegrationsResponse,
} from "@/types/lib/services/integrations";
import { getGitHubIntegrationsByOrganization } from "./github-integration";

const integrationFetchers: Partial<
  Record<IntegrationType, IntegrationFetcher>
> = {
  github: async (organizationId) => {
    const integrations =
      await getGitHubIntegrationsByOrganization(organizationId);

    return integrations.map((integration) => {
      const uniqueRepositories = Array.from(
        new Map(
          integration.repositories.map((repo) => [
            `${repo.owner}/${repo.repo}`,
            repo,
          ])
        ).values()
      );

      return {
        id: integration.id,
        displayName: integration.displayName,
        type: "github" as const,
        enabled: integration.enabled,
        createdAt: integration.createdAt,
        repositories: uniqueRepositories.map((repo) => ({
          id: repo.id,
          owner: repo.owner,
          repo: repo.repo,
          defaultBranch: repo.defaultBranch,
          enabled: repo.enabled,
        })),
      };
    });
  },
};

export function registerIntegrationFetcher(
  type: IntegrationType,
  fetcher: IntegrationFetcher
) {
  integrationFetchers[type] = fetcher;
}

export async function getIntegrationsByOrganization(
  organizationId: string
): Promise<IntegrationsResponse> {
  const activeFetchers = Object.entries(integrationFetchers).filter(
    (entry): entry is [IntegrationType, IntegrationFetcher] =>
      entry[1] !== undefined
  );

  const results = await Promise.all(
    activeFetchers.map(([, fetcher]) => fetcher(organizationId))
  );

  const integrations = results.flat();

  return {
    integrations,
    count: integrations.length,
  };
}

export async function getIntegrationCountByOrganization(
  organizationId: string
) {
  const { count } = await getIntegrationsByOrganization(organizationId);
  return count;
}
