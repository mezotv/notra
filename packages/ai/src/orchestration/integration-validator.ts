import type {
  ContextItem,
  IntegrationFetchers,
  ValidatedIntegration,
} from "@notra/ai/types/orchestration";

export async function validateIntegrations(
  organizationId: string,
  contextItems: ContextItem[] = [],
  fetchers?: IntegrationFetchers
): Promise<ValidatedIntegration[]> {
  if (!contextItems.length || !fetchers) {
    return [];
  }

  const validatedIntegrations: ValidatedIntegration[] = [];

  const githubItems = contextItems.filter((c) => c.type === "github-repo");
  const linearItems = contextItems.filter((c) => c.type === "linear-team");

  if (githubItems.length > 0 && fetchers.getGitHubIntegrationById) {
    const integrationIds = [
      ...new Set(githubItems.map((c) => c.integrationId)),
    ];

    for (const integrationId of integrationIds) {
      try {
        const integration =
          await fetchers.getGitHubIntegrationById(integrationId);

        if (!integration) {
          console.warn(
            `[Integration Validator] GitHub integration not found: ${integrationId}`
          );
          continue;
        }

        if (integration.organizationId !== organizationId) {
          console.warn(
            `[Integration Validator] GitHub integration ${integrationId} does not belong to org ${organizationId}`
          );
          continue;
        }

        if (!integration.enabled) {
          console.warn(
            `[Integration Validator] GitHub integration ${integrationId} is disabled`
          );
          continue;
        }

        const contextRepos = githubItems
          .filter((c) => c.integrationId === integrationId)
          .map((c) => ({ owner: c.owner, repo: c.repo }));

        const enabledRepos = integration.repositories
          .filter((r) => {
            if (!r.enabled) {
              return false;
            }
            return contextRepos.some(
              (cr) => cr.owner === r.owner && cr.repo === r.repo
            );
          })
          .map((r) => ({
            id: r.id,
            owner: r.owner,
            repo: r.repo,
            defaultBranch: r.defaultBranch ?? null,
            enabled: r.enabled,
          }));

        if (enabledRepos.length === 0) {
          console.warn(
            `[Integration Validator] No enabled repositories for integration ${integrationId}`
          );
          continue;
        }

        validatedIntegrations.push({
          id: integration.id,
          type: "github",
          enabled: integration.enabled,
          displayName: integration.displayName,
          organizationId: integration.organizationId,
          repositories: enabledRepos,
        });
      } catch (error) {
        console.error(
          `[Integration Validator] Error validating GitHub integration ${integrationId}:`,
          error
        );
      }
    }
  }

  if (linearItems.length > 0 && fetchers.getLinearIntegrationById) {
    const integrationIds = [
      ...new Set(linearItems.map((c) => c.integrationId)),
    ];

    for (const integrationId of integrationIds) {
      try {
        const integration =
          await fetchers.getLinearIntegrationById(integrationId);

        if (!integration) {
          console.warn(
            `[Integration Validator] Linear integration not found: ${integrationId}`
          );
          continue;
        }

        if (integration.organizationId !== organizationId) {
          console.warn(
            `[Integration Validator] Linear integration ${integrationId} does not belong to org ${organizationId}`
          );
          continue;
        }

        if (!integration.enabled) {
          console.warn(
            `[Integration Validator] Linear integration ${integrationId} is disabled`
          );
          continue;
        }

        validatedIntegrations.push({
          id: integration.id,
          type: "linear",
          enabled: integration.enabled,
          displayName: integration.displayName,
          organizationId: integration.organizationId,
          linearTeamId: integration.linearTeamId,
          linearTeamName: integration.linearTeamName,
        });
      } catch (error) {
        console.error(
          `[Integration Validator] Error validating Linear integration ${integrationId}:`,
          error
        );
      }
    }
  }

  return validatedIntegrations;
}

export function hasEnabledGitHubIntegration(
  validatedIntegrations: ValidatedIntegration[]
): boolean {
  return validatedIntegrations.some(
    (i) => i.type === "github" && i.enabled && i.repositories.length > 0
  );
}

export function hasEnabledLinearIntegration(
  validatedIntegrations: ValidatedIntegration[]
): boolean {
  return validatedIntegrations.some((i) => i.type === "linear" && i.enabled);
}

export function getRepoContexts(
  validatedIntegrations: ValidatedIntegration[]
): Array<{ owner: string; repo: string }> {
  return validatedIntegrations.flatMap((i) =>
    i.type === "github"
      ? i.repositories.map((r) => ({ owner: r.owner, repo: r.repo }))
      : []
  );
}
