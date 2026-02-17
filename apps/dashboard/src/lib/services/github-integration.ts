import crypto from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  githubIntegrations,
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

export interface GitHubToolRepositoryContext {
  integrationId: string;
  organizationId: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
  token: string | undefined;
}

export class GitHubBranchNotFoundError extends Error {
  constructor(owner: string, repo: string, branch: string) {
    super(`Branch "${branch}" does not exist in ${owner}/${repo}`);
    this.name = "GitHubBranchNotFoundError";
  }
}

function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

function toRepositoryRecord(integration: {
  id: string;
  owner: string | null;
  repo: string | null;
  defaultBranch: string | null;
  repositoryEnabled: boolean;
  encryptedWebhookSecret: string | null;
  outputs?: Array<{
    id: string;
    repositoryId: string;
    outputType: string;
    enabled: boolean;
    config: unknown;
    createdAt: Date;
  }>;
}) {
  return {
    id: integration.id,
    owner: integration.owner ?? "",
    repo: integration.repo ?? "",
    defaultBranch: integration.defaultBranch,
    enabled: integration.repositoryEnabled,
    encryptedWebhookSecret: integration.encryptedWebhookSecret,
    outputs: integration.outputs ?? [],
  };
}

function toIntegrationWithRepository<
  T extends {
    id: string;
    owner: string | null;
    repo: string | null;
    defaultBranch: string | null;
    repositoryEnabled: boolean;
    encryptedWebhookSecret: string | null;
    outputs?: Array<{
      id: string;
      repositoryId: string;
      outputType: string;
      enabled: boolean;
      config: unknown;
      createdAt: Date;
    }>;
  },
>(integration: T) {
  return {
    ...integration,
    repositories: [toRepositoryRecord(integration)],
  };
}

async function findRepositoryInOrganization(
  organizationId: string,
  owner: string,
  repo: string
) {
  const [existing] = await db
    .select({ id: githubIntegrations.id })
    .from(githubIntegrations)
    .where(
      and(
        eq(githubIntegrations.organizationId, organizationId),
        sql`lower(${githubIntegrations.owner}) = ${owner.toLowerCase()}`,
        sql`lower(${githubIntegrations.repo}) = ${repo.toLowerCase()}`
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

  const webhookSecret = generateWebhookSecret();
  const encryptedWebhookSecret = encryptToken(webhookSecret);

  const [integration] = await db
    .insert(githubIntegrations)
    .values({
      id: nanoid(),
      organizationId,
      createdByUserId: userId,
      encryptedToken,
      displayName,
      owner,
      repo,
      defaultBranch,
      repositoryEnabled: true,
      encryptedWebhookSecret,
      enabled: true,
    })
    .returning();

  if (!integration) {
    throw new Error("Failed to create integration");
  }

  await db.insert(repositoryOutputs).values([
    {
      id: nanoid(),
      repositoryId: integration.id,
      outputType: "changelog",
      enabled: true,
      config: null,
    },
    {
      id: nanoid(),
      repositoryId: integration.id,
      outputType: "blog_post",
      enabled: false,
      config: null,
    },
    {
      id: nanoid(),
      repositoryId: integration.id,
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

export async function getGitHubIntegrationsByOrganization(
  organizationId: string
) {
  const integrations = await db.query.githubIntegrations.findMany({
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
      outputs: true,
    },
  });

  return integrations.map((integration) =>
    toIntegrationWithRepository(integration)
  );
}

export async function getGitHubIntegrationById(integrationId: string) {
  const integration = await db.query.githubIntegrations.findFirst({
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
      outputs: true,
    },
  });

  if (!integration) {
    return null;
  }

  return toIntegrationWithRepository(integration);
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
  _params: AddRepositoryParams & { userId: string }
) {
  throw new Error(
    "GitHub integrations now support exactly one repository. Create a new integration for another repo."
  );
}

export async function getRepositoryById(repositoryId: string) {
  const integration = await db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, repositoryId),
    with: {
      outputs: true,
    },
  });

  if (!integration) {
    return null;
  }

  return {
    ...toRepositoryRecord(integration),
    integration: {
      id: integration.id,
      organizationId: integration.organizationId,
      encryptedToken: integration.encryptedToken,
      enabled: integration.enabled,
    },
  };
}

export async function getOutputById(outputId: string) {
  const output = await db.query.repositoryOutputs.findFirst({
    where: eq(repositoryOutputs.id, outputId),
    with: {
      integration: true,
    },
  });

  if (!output) {
    return null;
  }

  return {
    ...output,
    repository: {
      id: output.integration.id,
      owner: output.integration.owner ?? "",
      repo: output.integration.repo ?? "",
      defaultBranch: output.integration.defaultBranch,
      enabled: output.integration.repositoryEnabled,
      integration: output.integration,
    },
  };
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
    .update(githubIntegrations)
    .set({
      ...(data.enabled !== undefined
        ? { repositoryEnabled: data.enabled }
        : {}),
      ...(data.defaultBranch !== undefined
        ? { defaultBranch: data.defaultBranch }
        : {}),
    })
    .where(eq(githubIntegrations.id, repositoryId))
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
    .delete(githubIntegrations)
    .where(eq(githubIntegrations.id, repositoryId));
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
    sql`lower(${githubIntegrations.owner}) = ${owner.toLowerCase()}`,
    sql`lower(${githubIntegrations.repo}) = ${repo.toLowerCase()}`,
  ];

  if (options?.organizationId) {
    whereClauses.push(
      eq(githubIntegrations.organizationId, options.organizationId)
    );
  }

  const [integration] = await db
    .select({
      encryptedToken: githubIntegrations.encryptedToken,
      integrationEnabled: githubIntegrations.enabled,
      repositoryEnabled: githubIntegrations.repositoryEnabled,
    })
    .from(githubIntegrations)
    .where(and(...whereClauses))
    .limit(1);

  if (
    !(
      integration?.encryptedToken &&
      integration.integrationEnabled &&
      integration.repositoryEnabled
    )
  ) {
    return undefined;
  }

  return decryptToken(integration.encryptedToken);
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

export async function getGitHubToolRepositoryContextByIntegrationId(
  integrationId: string,
  options?: { organizationId?: string }
): Promise<GitHubToolRepositoryContext> {
  const whereClause = options?.organizationId
    ? and(
        eq(githubIntegrations.id, integrationId),
        eq(githubIntegrations.organizationId, options.organizationId)
      )
    : eq(githubIntegrations.id, integrationId);

  const [integration] = await db
    .select({
      id: githubIntegrations.id,
      organizationId: githubIntegrations.organizationId,
      owner: githubIntegrations.owner,
      repo: githubIntegrations.repo,
      defaultBranch: githubIntegrations.defaultBranch,
      encryptedToken: githubIntegrations.encryptedToken,
      integrationEnabled: githubIntegrations.enabled,
      repositoryEnabled: githubIntegrations.repositoryEnabled,
    })
    .from(githubIntegrations)
    .where(whereClause)
    .limit(1);

  if (!integration) {
    throw new Error(
      `Repository access denied. Unknown integrationId ${integrationId}.`
    );
  }

  if (!(integration.integrationEnabled && integration.repositoryEnabled)) {
    throw new Error(
      `Repository access denied for integrationId ${integrationId}. Integration is disabled.`
    );
  }

  const owner = integration.owner?.trim();
  const repo = integration.repo?.trim();
  if (!owner || !repo) {
    throw new Error(
      `Repository configuration missing for integrationId ${integrationId}.`
    );
  }

  return {
    integrationId: integration.id,
    organizationId: integration.organizationId,
    owner,
    repo,
    defaultBranch: integration.defaultBranch,
    token: integration.encryptedToken
      ? decryptToken(integration.encryptedToken)
      : undefined,
  };
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
    .update(githubIntegrations)
    .set({ encryptedWebhookSecret: encryptedSecret })
    .where(eq(githubIntegrations.id, repositoryId));

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
  const integration = await db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, repositoryId),
    columns: {
      encryptedWebhookSecret: true,
    },
  });

  return !!integration?.encryptedWebhookSecret;
}

export async function getWebhookSecretByRepositoryId(repositoryId: string) {
  const integration = await db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, repositoryId),
    columns: {
      encryptedWebhookSecret: true,
    },
  });

  if (!integration?.encryptedWebhookSecret) {
    return null;
  }

  return decryptToken(integration.encryptedWebhookSecret);
}

function buildWebhookUrl(
  integrationId: string,
  organizationId: string,
  repositoryId: string
): string {
  const baseUrl = getConfiguredAppUrl() ?? "http://localhost:3000";
  return `${baseUrl}/api/webhooks/github/${organizationId}/${integrationId}/${repositoryId}`;
}
