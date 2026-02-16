import crypto from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  githubIntegrations,
  githubRepositories,
  members,
  repositoryOutputs,
} from "@notra/db/schema";

import { and, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { decryptToken, encryptToken } from "@/lib/crypto/token-encryption";
import type {
  ErrorWithStatus,
  ValidateRepositoryBranchExistsParams,
} from "@/types/lib/services/github";
import type {
  AddRepositoryParams,
  ConfigureOutputParams,
  CreateGitHubIntegrationParams,
  WebhookConfig,
} from "@/types/lib/services/integrations";
import { getConfiguredAppUrl } from "@/utils/url";
import { createOctokit } from "../octokit";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export class GitHubBranchNotFoundError extends Error {
  constructor(owner: string, repo: string, branch: string) {
    super(`Branch "${branch}" does not exist in ${owner}/${repo}`);
    this.name = "GitHubBranchNotFoundError";
  }
}

function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function findRepositoryInOrganization(
  organizationId: string,
  owner: string,
  repo: string
) {
  const [existing] = await db
    .select({ id: githubRepositories.id })
    .from(githubRepositories)
    .innerJoin(
      githubIntegrations,
      eq(githubRepositories.integrationId, githubIntegrations.id)
    )
    .where(
      and(
        eq(githubIntegrations.organizationId, organizationId),
        sql`lower(${githubRepositories.owner}) = ${owner.toLowerCase()}`,
        sql`lower(${githubRepositories.repo}) = ${repo.toLowerCase()}`
      )
    )
    .limit(1);

  return existing ?? null;
}

export async function validateUserOrgAccess(
  userId: string,
  organizationId: string
) {
  const member = await db.query.members.findFirst({
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId)
    ),
  });
  return !!member;
}

export async function createGitHubIntegration(
  params: CreateGitHubIntegrationParams
) {
  const {
    organizationId,
    userId,
    token,
    displayName,
    owner,
    repo,
    defaultBranch,
  } = params;

  const hasAccess = await validateUserOrgAccess(userId, organizationId);
  if (!hasAccess) {
    throw new Error("User does not have access to this organization");
  }

  const existingRepository = await findRepositoryInOrganization(
    organizationId,
    owner,
    repo
  );

  if (existingRepository) {
    throw new Error("Repository already connected");
  }

  let encryptedToken: string | null = null;

  if (token) {
    const octokit = createOctokit(token);

    try {
      await octokit.request("GET /user");
    } catch (_error) {
      throw new Error("Invalid GitHub token");
    }

    encryptedToken = encryptToken(token);
  } else {
    const octokit = createOctokit();

    try {
      await octokit.request("GET /repos/{owner}/{repo}", {
        owner,
        repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (_error) {
      throw new Error(
        "Unable to access repository. It may be private and require a Personal Access Token."
      );
    }
  }

  const [integration] = await db
    .insert(githubIntegrations)
    .values({
      id: nanoid(),
      organizationId,
      createdByUserId: userId,
      encryptedToken,
      displayName,
      enabled: true,
    })
    .returning();

  if (!integration) {
    throw new Error("Failed to create integration");
  }

  // Generate webhook secret upfront so it's ready immediately
  const webhookSecret = generateWebhookSecret();
  const encryptedWebhookSecret = encryptToken(webhookSecret);

  const [repository] = await db
    .insert(githubRepositories)
    .values({
      id: nanoid(),
      integrationId: integration.id,
      owner,
      repo,
      defaultBranch,
      enabled: true,
      encryptedWebhookSecret,
    })
    .returning();

  if (!repository) {
    throw new Error("Failed to create repository");
  }

  await db.insert(repositoryOutputs).values([
    {
      id: nanoid(),
      repositoryId: repository.id,
      outputType: "changelog",
      enabled: true,
      config: null,
    },
    {
      id: nanoid(),
      repositoryId: repository.id,
      outputType: "blog_post",
      enabled: false,
      config: null,
    },
    {
      id: nanoid(),
      repositoryId: repository.id,
      outputType: "twitter_post",
      enabled: false,
      config: null,
    },
  ]);

  const fullIntegration = await getGitHubIntegrationById(integration.id);
  if (!fullIntegration) {
    throw new Error("Failed to retrieve created integration");
  }

  return fullIntegration;
}

export function getGitHubIntegrationsByOrganization(organizationId: string) {
  return db.query.githubIntegrations.findMany({
    where: eq(githubIntegrations.organizationId, organizationId),
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      repositories: {
        with: {
          outputs: true,
        },
      },
    },
  });
}

export function getGitHubIntegrationById(integrationId: string) {
  return db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, integrationId),
    with: {
      organization: true,
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      repositories: {
        with: {
          outputs: true,
        },
      },
    },
  });
}

export async function getDecryptedToken(integrationId: string, userId: string) {
  const integration = await getGitHubIntegrationById(integrationId);

  if (!integration) {
    throw new Error("Integration not found");
  }

  const hasAccess = await validateUserOrgAccess(
    userId,
    integration.organizationId
  );

  if (!hasAccess) {
    throw new Error("User does not have access to this integration");
  }

  if (!integration.encryptedToken) {
    return null;
  }

  return decryptToken(integration.encryptedToken);
}

export async function addRepository(
  params: AddRepositoryParams & { userId: string }
) {
  const { integrationId, owner, repo, outputs = [], userId } = params;

  const integration = await getGitHubIntegrationById(integrationId);
  if (!integration) {
    throw new Error("Integration not found");
  }

  const hasAccess = await validateUserOrgAccess(
    userId,
    integration.organizationId
  );

  if (!hasAccess) {
    throw new Error("User does not have access to this integration");
  }

  const existingRepositoryInOrg = await findRepositoryInOrganization(
    integration.organizationId,
    owner,
    repo
  );

  if (existingRepositoryInOrg) {
    throw new Error("Repository already connected");
  }

  // Generate webhook secret upfront so it's ready immediately
  const webhookSecret = generateWebhookSecret();
  const encryptedWebhookSecret = encryptToken(webhookSecret);

  const [repository] = await db
    .insert(githubRepositories)
    .values({
      id: nanoid(),
      integrationId,
      owner,
      repo,
      enabled: true,
      encryptedWebhookSecret,
    })
    .returning();

  if (!repository) {
    throw new Error("Failed to create repository");
  }

  if (outputs.length > 0) {
    await db.insert(repositoryOutputs).values(
      outputs.map((output) => ({
        id: nanoid(),
        repositoryId: repository.id,
        outputType: output.type,
        enabled: output.enabled ?? true,
        config: output.config,
      }))
    );
  }

  return repository;
}

export function getRepositoryById(repositoryId: string) {
  return db.query.githubRepositories.findFirst({
    where: eq(githubRepositories.id, repositoryId),
    with: {
      integration: true,
      outputs: true,
    },
  });
}

export function getOutputById(outputId: string) {
  return db.query.repositoryOutputs.findFirst({
    where: eq(repositoryOutputs.id, outputId),
    with: {
      repository: {
        with: {
          integration: true,
        },
      },
    },
  });
}

export async function configureOutput(params: ConfigureOutputParams) {
  const { repositoryId, outputType, enabled, config } = params;

  const existing = await db.query.repositoryOutputs.findFirst({
    where: and(
      eq(repositoryOutputs.repositoryId, repositoryId),
      eq(repositoryOutputs.outputType, outputType)
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(repositoryOutputs)
      .set({
        enabled,
        config,
      })
      .where(eq(repositoryOutputs.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(repositoryOutputs)
    .values({
      id: nanoid(),
      repositoryId,
      outputType,
      enabled,
      config,
    })
    .returning();

  return created;
}

export async function toggleGitHubIntegration(
  integrationId: string,
  enabled: boolean
) {
  const [updated] = await db
    .update(githubIntegrations)
    .set({ enabled })
    .where(eq(githubIntegrations.id, integrationId))
    .returning();

  return updated;
}

export async function updateGitHubIntegration(
  integrationId: string,
  data: { enabled?: boolean; displayName?: string }
) {
  const [updated] = await db
    .update(githubIntegrations)
    .set(data)
    .where(eq(githubIntegrations.id, integrationId))
    .returning();

  return updated;
}

export async function toggleRepository(repositoryId: string, enabled: boolean) {
  return updateRepository(repositoryId, { enabled });
}

export async function updateRepository(
  repositoryId: string,
  data: { enabled?: boolean; defaultBranch?: string | null }
) {
  const [updated] = await db
    .update(githubRepositories)
    .set(data)
    .where(eq(githubRepositories.id, repositoryId))
    .returning();

  return updated;
}

export async function validateRepositoryBranchExists(
  params: ValidateRepositoryBranchExistsParams
) {
  const { owner, repo, branch, encryptedToken } = params;

  const normalizedBranch = branch.trim();
  if (!normalizedBranch) {
    return;
  }

  const token = encryptedToken ? decryptToken(encryptedToken) : undefined;
  const octokit = createOctokit(token);

  try {
    await octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
      owner,
      repo,
      branch: normalizedBranch,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (error) {
    const status = (error as ErrorWithStatus).status;

    if (status === 404) {
      throw new GitHubBranchNotFoundError(owner, repo, normalizedBranch);
    }

    throw error;
  }
}

export async function toggleOutput(outputId: string, enabled: boolean) {
  const [updated] = await db
    .update(repositoryOutputs)
    .set({ enabled })
    .where(eq(repositoryOutputs.id, outputId))
    .returning();

  return updated;
}

export async function deleteGitHubIntegration(integrationId: string) {
  await db
    .delete(githubIntegrations)
    .where(eq(githubIntegrations.id, integrationId));
}

export async function deleteRepository(repositoryId: string) {
  await db
    .delete(githubRepositories)
    .where(eq(githubRepositories.id, repositoryId));
}

export async function listAvailableRepositories(
  integrationId: string,
  userId: string
) {
  const token = await getDecryptedToken(integrationId, userId);

  if (!token) {
    return [];
  }

  const octokit = createOctokit(token);

  const { data } = await octokit.request("GET /user/repos", {
    per_page: 100,
    sort: "updated",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return data.map((repo) => ({
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    description: repo.description,
    url: repo.html_url,
  }));
}

export async function getTokenForRepository(
  owner: string,
  repo: string,
  options?: { organizationId?: string }
) {
  const whereClauses = [
    sql`lower(${githubRepositories.owner}) = ${owner.toLowerCase()}`,
    sql`lower(${githubRepositories.repo}) = ${repo.toLowerCase()}`,
  ];

  if (options?.organizationId) {
    whereClauses.push(
      eq(githubIntegrations.organizationId, options.organizationId)
    );
  }

  const [repository] = await db
    .select({
      encryptedToken: githubIntegrations.encryptedToken,
      integrationEnabled: githubIntegrations.enabled,
    })
    .from(githubRepositories)
    .innerJoin(
      githubIntegrations,
      eq(githubRepositories.integrationId, githubIntegrations.id)
    )
    .where(and(...whereClauses))
    .limit(1);

  if (!(repository?.encryptedToken && repository.integrationEnabled)) {
    return undefined;
  }

  return decryptToken(repository.encryptedToken);
}

export async function getTokenForIntegrationId(integrationId: string) {
  const integration = await db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, integrationId),
  });

  if (!integration?.encryptedToken) {
    return null;
  }

  return decryptToken(integration.encryptedToken);
}

export async function generateWebhookSecretForRepository(
  repositoryId: string,
  userId: string
): Promise<WebhookConfig> {
  const repository = await getRepositoryById(repositoryId);

  if (!repository) {
    throw new Error("Repository not found");
  }

  const hasAccess = await validateUserOrgAccess(
    userId,
    repository.integration.organizationId
  );

  if (!hasAccess) {
    throw new Error("User does not have access to this repository");
  }

  const secret = generateWebhookSecret();
  const encryptedSecret = encryptToken(secret);

  await db
    .update(githubRepositories)
    .set({ encryptedWebhookSecret: encryptedSecret })
    .where(eq(githubRepositories.id, repositoryId));

  const webhookUrl = buildWebhookUrl(
    repository.integration.id,
    repository.integration.organizationId,
    repositoryId
  );

  return {
    webhookUrl,
    webhookSecret: secret,
    repositoryId,
    owner: repository.owner,
    repo: repository.repo,
  };
}

export async function getWebhookConfigForRepository(
  repositoryId: string,
  userId: string
): Promise<WebhookConfig | null> {
  const repository = await getRepositoryById(repositoryId);

  if (!repository) {
    throw new Error("Repository not found");
  }

  const hasAccess = await validateUserOrgAccess(
    userId,
    repository.integration.organizationId
  );

  if (!hasAccess) {
    throw new Error("User does not have access to this repository");
  }

  if (!repository.encryptedWebhookSecret) {
    return null;
  }

  const webhookSecret = decryptToken(repository.encryptedWebhookSecret);
  const webhookUrl = buildWebhookUrl(
    repository.integration.id,
    repository.integration.organizationId,
    repositoryId
  );

  return {
    webhookUrl,
    webhookSecret,
    repositoryId,
    owner: repository.owner,
    repo: repository.repo,
  };
}

export async function hasWebhookConfigured(repositoryId: string) {
  const repository = await db.query.githubRepositories.findFirst({
    where: eq(githubRepositories.id, repositoryId),
    columns: {
      encryptedWebhookSecret: true,
    },
  });

  return !!repository?.encryptedWebhookSecret;
}

export async function getWebhookSecretByRepositoryId(repositoryId: string) {
  const repository = await db.query.githubRepositories.findFirst({
    where: eq(githubRepositories.id, repositoryId),
    columns: {
      encryptedWebhookSecret: true,
    },
  });

  if (!repository?.encryptedWebhookSecret) {
    return null;
  }

  return decryptToken(repository.encryptedWebhookSecret);
}

function buildWebhookUrl(
  integrationId: string,
  organizationId: string,
  repositoryId: string
): string {
  const baseUrl = getConfiguredAppUrl() ?? "http://localhost:3000";
  return `${baseUrl}/api/webhooks/github/${organizationId}/${integrationId}/${repositoryId}`;
}
