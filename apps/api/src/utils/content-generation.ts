import type { ContentGenerationWorkflowPayload } from "@notra/content-generation/schemas";
import type { createDb } from "@notra/db/drizzle-http";
import {
  brandSettings,
  githubIntegrations,
  linearIntegrations,
} from "@notra/db/schema";
import { Client as WorkflowClient } from "@upstash/workflow";
import { and, desc, eq, inArray } from "drizzle-orm";

type DbClient = ReturnType<typeof createDb>;

interface ContentGenerationEnv {
  QSTASH_TOKEN?: string;
  WORKFLOW_BASE_URL?: string;
}

interface ContentGenerationRuntimeEnv extends ContentGenerationEnv {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getContentGenerationWorkflowUrl(env: ContentGenerationEnv) {
  if (env.WORKFLOW_BASE_URL) {
    return `${trimTrailingSlash(env.WORKFLOW_BASE_URL)}/api/workflows/on-demand-content`;
  }

  return null;
}

export function isContentGenerationConfigured(env: ContentGenerationEnv) {
  return !!(env.QSTASH_TOKEN && getContentGenerationWorkflowUrl(env));
}

export function getContentGenerationUnavailableReason(
  runtimeEnv: ContentGenerationRuntimeEnv
) {
  if (
    !(runtimeEnv.UPSTASH_REDIS_REST_URL && runtimeEnv.UPSTASH_REDIS_REST_TOKEN)
  ) {
    return "Content generation is unavailable: Redis is not configured";
  }

  if (!runtimeEnv.QSTASH_TOKEN) {
    return "Content generation is unavailable: QStash is not configured";
  }

  if (!runtimeEnv.WORKFLOW_BASE_URL) {
    return "Content generation is unavailable: workflow URL is not configured";
  }

  return null;
}

export async function triggerContentGenerationWorkflow(
  env: ContentGenerationEnv,
  payload: ContentGenerationWorkflowPayload
) {
  const token = env.QSTASH_TOKEN;
  const url = getContentGenerationWorkflowUrl(env);

  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }

  if (!url) {
    throw new Error("Content generation workflow URL is not configured");
  }

  const client = new WorkflowClient({ token });
  const result = await client.trigger({
    url,
    body: payload,
  });

  return result.workflowRunId;
}

export async function resolveRequestedRepositoryIds(
  db: DbClient,
  organizationId: string,
  request: {
    integrations?: {
      github?: string[];
    };
    github?: {
      repositories: Array<{ owner: string; repo: string }>;
    };
  }
) {
  if (request.integrations?.github?.length) {
    const uniqueIntegrationIds = Array.from(
      new Set(request.integrations.github)
    );
    const connectedRepositories = await db
      .select({
        id: githubIntegrations.id,
      })
      .from(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.organizationId, organizationId),
          eq(githubIntegrations.enabled, true),
          inArray(githubIntegrations.id, uniqueIntegrationIds)
        )
      );

    const matchedRepositoryIds = connectedRepositories.map(
      (integration) => integration.id
    );

    if (matchedRepositoryIds.length !== uniqueIntegrationIds.length) {
      const connectedRepositoryIds = new Set(matchedRepositoryIds);
      const missingIntegrationIds = uniqueIntegrationIds.filter(
        (integrationId) => !connectedRepositoryIds.has(integrationId)
      );

      throw new Error(
        `Requested GitHub integrations are not available for this organization: ${missingIntegrationIds.join(", ")}`
      );
    }

    return matchedRepositoryIds;
  }

  if (!request.github?.repositories?.length) {
    return undefined;
  }

  const connectedRepositories = await db
    .select({
      id: githubIntegrations.id,
      owner: githubIntegrations.owner,
      repo: githubIntegrations.repo,
    })
    .from(githubIntegrations)
    .where(
      and(
        eq(githubIntegrations.organizationId, organizationId),
        eq(githubIntegrations.enabled, true)
      )
    );

  const uniqueRequestedRepositories = Array.from(
    new Map(
      request.github.repositories.map((repository) => [
        `${repository.owner.toLowerCase()}/${repository.repo.toLowerCase()}`,
        repository,
      ])
    ).values()
  );

  const requestedRepos = new Set(
    uniqueRequestedRepositories.map(
      ({ owner, repo }) => `${owner.toLowerCase()}/${repo.toLowerCase()}`
    )
  );

  const matchedRepositoryIds = connectedRepositories
    .filter(
      (integration: {
        id: string;
        owner: string | null;
        repo: string | null;
      }) => {
        if (!(integration.owner && integration.repo)) {
          return false;
        }

        return requestedRepos.has(
          `${integration.owner.toLowerCase()}/${integration.repo.toLowerCase()}`
        );
      }
    )
    .map((integration) => integration.id);

  if (matchedRepositoryIds.length !== uniqueRequestedRepositories.length) {
    const connectedRepoNames = new Set(
      connectedRepositories
        .filter((integration) => integration.owner && integration.repo)
        .map(
          (integration) =>
            `${integration.owner?.toLowerCase()}/${integration.repo?.toLowerCase()}`
        )
    );

    const missingRepositories = uniqueRequestedRepositories.filter(
      ({ owner, repo }) =>
        !connectedRepoNames.has(`${owner.toLowerCase()}/${repo.toLowerCase()}`)
    );

    throw new Error(
      `Requested repositories are not connected for this organization: ${missingRepositories
        .map(({ owner, repo }) => `${owner}/${repo}`)
        .join(", ")}`
    );
  }

  return matchedRepositoryIds;
}

export async function resolveRequestedLinearIntegrationIds(
  db: DbClient,
  organizationId: string,
  request: {
    integrations?: {
      linear?: string[];
    };
  }
) {
  const requestedIntegrationIds = request.integrations?.linear;

  if (!requestedIntegrationIds?.length) {
    return undefined;
  }

  const uniqueIntegrationIds = Array.from(new Set(requestedIntegrationIds));
  const connectedIntegrations = await db
    .select({
      id: linearIntegrations.id,
    })
    .from(linearIntegrations)
    .where(
      and(
        eq(linearIntegrations.organizationId, organizationId),
        eq(linearIntegrations.enabled, true),
        inArray(linearIntegrations.id, uniqueIntegrationIds)
      )
    );

  const matchedIntegrationIds = connectedIntegrations.map(
    (integration) => integration.id
  );

  if (matchedIntegrationIds.length !== uniqueIntegrationIds.length) {
    const connectedIntegrationIds = new Set(matchedIntegrationIds);
    const missingIntegrationIds = uniqueIntegrationIds.filter(
      (integrationId) => !connectedIntegrationIds.has(integrationId)
    );

    throw new Error(
      `Requested Linear integrations are not available for this organization: ${missingIntegrationIds.join(", ")}`
    );
  }

  return matchedIntegrationIds;
}

export async function resolveRequestedBrandVoiceId(
  db: DbClient,
  organizationId: string,
  brandVoiceId?: string | null
) {
  if (brandVoiceId) {
    const explicitVoice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, brandVoiceId),
        eq(brandSettings.organizationId, organizationId)
      ),
      columns: {
        id: true,
      },
    });

    if (!explicitVoice) {
      throw new Error(
        "Requested brand voice does not belong to this organization"
      );
    }

    return explicitVoice.id;
  }

  const defaultVoice = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, organizationId),
      eq(brandSettings.isDefault, true)
    ),
    columns: {
      id: true,
    },
  });

  if (defaultVoice) {
    return defaultVoice.id;
  }

  const latestVoice = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organizationId),
    orderBy: [desc(brandSettings.updatedAt)],
    columns: {
      id: true,
    },
  });

  return latestVoice?.id ?? null;
}
