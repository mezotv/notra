import { CHAT_INTEGRATIONS_CACHE_TTL_SECONDS } from "../constants/chat";
import {
  getGitHubIntegrationsByOrganization,
  getGitHubToolRepositoryContextByIntegrationId,
} from "../integrations/github";
import {
  getLinearIntegrationsByOrganization,
  getLinearToolContextByIntegrationId,
} from "../integrations/linear";
import type { ValidatedIntegration } from "../types/orchestration";
import { redis } from "../utils/redis";

function cacheKey(organizationId: string) {
  return `chat:integrations:${organizationId}`;
}

export async function getStandaloneChatIntegrations(
  organizationId: string
): Promise<ValidatedIntegration[]> {
  if (redis) {
    try {
      const cached = await redis.get<ValidatedIntegration[]>(
        cacheKey(organizationId)
      );
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error("[chat-integrations-cache] Redis get failed:", error);
    }
  }

  const fresh = await loadStandaloneChatIntegrations(organizationId);

  if (redis) {
    try {
      await redis.set(cacheKey(organizationId), fresh, {
        ex: CHAT_INTEGRATIONS_CACHE_TTL_SECONDS,
      });
    } catch (error) {
      console.error("[chat-integrations-cache] Redis set failed:", error);
    }
  }

  return fresh;
}

export async function invalidateStandaloneChatIntegrations(
  organizationId: string
) {
  if (!redis) {
    return;
  }
  try {
    await redis.del(cacheKey(organizationId));
  } catch (error) {
    console.error("[chat-integrations-cache] Redis del failed:", error);
  }
}

async function loadStandaloneChatIntegrations(
  organizationId: string
): Promise<ValidatedIntegration[]> {
  const [githubIntegrations, linearIntegrations] = await Promise.all([
    getGitHubIntegrationsByOrganization(organizationId),
    getLinearIntegrationsByOrganization(organizationId),
  ]);

  const github = githubIntegrations
    .filter((integration) => integration.enabled)
    .map(
      (integration): ValidatedIntegration => ({
        id: integration.id,
        type: "github" as const,
        enabled: integration.enabled,
        displayName: integration.displayName,
        organizationId: integration.organizationId,
        repositories: integration.repositories
          .filter((repository) => repository.enabled)
          .map((repository) => ({
            id: repository.id,
            owner: repository.owner,
            repo: repository.repo,
            defaultBranch: repository.defaultBranch ?? null,
            enabled: repository.enabled,
          })),
      })
    )
    .filter((integration) => {
      return (
        integration.type === "github" && integration.repositories.length > 0
      );
    });

  const linear = linearIntegrations
    .filter((integration) => integration.enabled)
    .map(
      (integration): ValidatedIntegration => ({
        id: integration.id,
        type: "linear" as const,
        enabled: integration.enabled,
        displayName: integration.displayName,
        organizationId: integration.organizationId,
        linearTeamId: integration.linearTeamId,
        linearTeamName: integration.linearTeamName,
      })
    );

  return [...github, ...linear];
}

export const standaloneChatResolvers = {
  resolveContext: getGitHubToolRepositoryContextByIntegrationId,
  resolveLinearContext: getLinearToolContextByIntegrationId,
};
