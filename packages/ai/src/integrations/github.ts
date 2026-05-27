import crypto from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  githubAppInstallations,
  githubIntegrations,
  members,
  repositoryOutputs,
} from "@notra/db/schema";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import {
  DEFAULT_REPOSITORY_OUTPUT_CONFIG,
  GITHUB_API_VERSION,
} from "../constants/github";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import type {
  AddRepositoryParams,
  ConfigureOutputParams,
  CreateGitHubAppIntegrationsForInstallationParams,
  CreateGitHubIntegrationParams,
  ErrorWithStatus,
  GitHubAppRepository,
  GitHubIntegrationAuthType,
  ValidateRepositoryBranchExistsParams,
  WebhookConfig,
} from "../types/integrations";
import type { GitHubToolRepositoryContext } from "../types/tools";
import {
  createGitHubAppInstallationOctokit,
  createGitHubAppInstallationToken,
  createGitHubAppOctokit,
} from "../utils/github-app";
import { createOctokit } from "../utils/octokit";
import { getConfiguredAppUrl } from "../utils/url";

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

function toRepositoryRecord(integration: {
  id: string;
  authType?: GitHubIntegrationAuthType | string;
  githubAppInstallationId?: string | null;
  githubAppInstallationAccountLogin?: string | null;
  githubAppInstallationAccountType?: string | null;
  githubAppRepositoryId?: number | null;
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
    authType: integration.authType ?? "legacy",
    githubAppInstallationId: integration.githubAppInstallationId ?? null,
    githubAppInstallationAccountLogin:
      integration.githubAppInstallationAccountLogin ?? null,
    githubAppInstallationAccountType:
      integration.githubAppInstallationAccountType ?? null,
    githubAppRepositoryId: integration.githubAppRepositoryId ?? null,
    owner: integration.owner ?? "",
    repo: integration.repo ?? "",
    defaultBranch: integration.defaultBranch,
    enabled: integration.repositoryEnabled,
    encryptedWebhookSecret: integration.encryptedWebhookSecret,
    outputs: integration.outputs ?? [],
  };
}

function getDefaultRepositoryOutputs(repositoryId: string) {
  return DEFAULT_REPOSITORY_OUTPUT_CONFIG.map((output) => ({
    id: nanoid(),
    repositoryId,
    outputType: output.outputType,
    enabled: output.enabled,
    config: null,
  }));
}

async function resolveAuthTokenForIntegration(integration: {
  encryptedToken?: string | null;
  authType?: GitHubIntegrationAuthType | string | null;
  githubAppInstallationId?: string | null;
}) {
  if (integration.authType === "github_app") {
    if (!integration.githubAppInstallationId) {
      throw new Error("GitHub App installation is missing");
    }

    return createGitHubAppInstallationToken(
      integration.githubAppInstallationId
    );
  }

  return integration.encryptedToken
    ? decryptToken(integration.encryptedToken)
    : undefined;
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

export async function findConflictingRepositoryInOrganization(
  organizationId: string,
  owner: string,
  repo: string,
  excludeIntegrationId: string
) {
  const existing = await findRepositoryInOrganization(
    organizationId,
    owner,
    repo
  );

  if (!existing || existing.id === excludeIntegrationId) {
    return null;
  }

  return existing;
}

export class GitHubRepositoryNotFoundError extends Error {
  constructor(owner: string, repo: string) {
    super(`Repository ${owner}/${repo} not found or inaccessible`);
    this.name = "GitHubRepositoryNotFoundError";
  }
}

export async function validateRepositoryAccess(params: {
  owner: string;
  repo: string;
  token?: string;
  encryptedToken: string | null;
  authType?: string | null;
  githubAppInstallationId?: string | null;
}) {
  const {
    owner,
    repo,
    token,
    encryptedToken,
    authType,
    githubAppInstallationId,
  } = params;
  const resolvedToken =
    token?.trim() ||
    (await resolveAuthTokenForIntegration({
      encryptedToken,
      authType,
      githubAppInstallationId,
    }));
  const octokit = createOctokit(resolvedToken);

  try {
    await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    });
  } catch (error) {
    const status = (error as ErrorWithStatus).status;

    if (status === 404) {
      throw new GitHubRepositoryNotFoundError(owner, repo);
    }

    throw error;
  }
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
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
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

  await db
    .insert(repositoryOutputs)
    .values(getDefaultRepositoryOutputs(integration.id));

  const fullIntegration = await getGitHubIntegrationById(integration.id);
  if (!fullIntegration) {
    throw new Error("Failed to retrieve created integration");
  }

  return fullIntegration;
}

async function listGitHubAppInstallationRepositories(installationId: string) {
  const octokit = await createGitHubAppInstallationOctokit(installationId);
  const repositories: GitHubAppRepository[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.request("GET /installation/repositories", {
      per_page: 100,
      page,
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    });

    repositories.push(...(data.repositories as GitHubAppRepository[]));

    if (data.repositories.length < 100) {
      break;
    }

    page += 1;
  }

  return repositories;
}

export async function listGitHubAppRepositories(installationId: string) {
  const repositories =
    await listGitHubAppInstallationRepositories(installationId);

  return repositories.map((repo) => ({
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    description: repo.description,
    url: repo.html_url,
    defaultBranch: repo.default_branch,
    githubAppRepositoryId: repo.id,
  }));
}

export async function createGitHubAppIntegrationsForInstallation(
  params: CreateGitHubAppIntegrationsForInstallationParams
) {
  const hasAccess = await validateUserOrgAccess(
    params.userId,
    params.organizationId
  );
  if (!hasAccess) {
    throw new Error("User does not have access to this organization");
  }

  const appOctokit = createGitHubAppOctokit();
  const { data: installation } = await appOctokit.request(
    "GET /app/installations/{installation_id}",
    {
      installation_id: Number(params.installationId),
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    }
  );
  const account = installation.account;
  const accountLogin =
    account && "login" in account && typeof account.login === "string"
      ? account.login
      : null;
  const accountType =
    account && "type" in account && typeof account.type === "string"
      ? account.type
      : null;
  const repositories = await listGitHubAppInstallationRepositories(
    params.installationId
  );

  const createdIds = await db.transaction(async (tx) => {
    const [installationRecord] = await tx
      .insert(githubAppInstallations)
      .values({
        id: nanoid(),
        organizationId: params.organizationId,
        installationId: params.installationId,
        accountLogin,
        accountType,
        installedByUserId: params.userId,
      })
      .onConflictDoUpdate({
        target: [
          githubAppInstallations.organizationId,
          githubAppInstallations.installationId,
        ],
        set: {
          accountLogin,
          accountType,
          installedByUserId: params.userId,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: githubAppInstallations.id,
        installationId: githubAppInstallations.installationId,
        accountLogin: githubAppInstallations.accountLogin,
        accountType: githubAppInstallations.accountType,
      });

    if (!installationRecord) {
      throw new Error("Failed to upsert GitHub App installation");
    }

    const ids: string[] = [];
    const installedRepositoryIds = repositories.map((repo) => repo.id);

    if (installedRepositoryIds.length > 0) {
      await tx
        .update(githubIntegrations)
        .set({
          repositoryEnabled: false,
        })
        .where(
          and(
            eq(githubIntegrations.organizationId, params.organizationId),
            eq(githubIntegrations.authType, "github_app"),
            eq(
              githubIntegrations.githubAppInstallationId,
              params.installationId
            ),
            notInArray(
              githubIntegrations.githubAppRepositoryId,
              installedRepositoryIds
            )
          )
        );
    } else {
      await tx
        .update(githubIntegrations)
        .set({
          repositoryEnabled: false,
        })
        .where(
          and(
            eq(githubIntegrations.organizationId, params.organizationId),
            eq(githubIntegrations.authType, "github_app"),
            eq(
              githubIntegrations.githubAppInstallationId,
              params.installationId
            )
          )
        );
    }

    for (const repository of repositories) {
      const existingRepository = await tx.query.githubIntegrations.findFirst({
        where: and(
          eq(githubIntegrations.organizationId, params.organizationId),
          sql`lower(${githubIntegrations.owner}) = ${repository.owner.login.toLowerCase()}`,
          sql`lower(${githubIntegrations.repo}) = ${repository.name.toLowerCase()}`
        ),
        columns: {
          id: true,
        },
      });

      if (existingRepository) {
        await tx
          .update(githubIntegrations)
          .set({
            githubAppInstallationRecordId: installationRecord.id,
            authType: "github_app",
            githubAppInstallationId: params.installationId,
            githubAppInstallationAccountLogin: accountLogin,
            githubAppInstallationAccountType: accountType,
            githubAppRepositoryId: repository.id,
            defaultBranch: repository.default_branch,
            enabled: true,
            repositoryEnabled: true,
          })
          .where(eq(githubIntegrations.id, existingRepository.id));
        ids.push(existingRepository.id);
        continue;
      }

      const integrationId = nanoid();
      const webhookSecret = generateWebhookSecret();
      const encryptedWebhookSecret = encryptToken(webhookSecret);

      const [createdIntegration] = await tx
        .insert(githubIntegrations)
        .values({
          id: integrationId,
          organizationId: params.organizationId,
          createdByUserId: params.userId,
          encryptedToken: null,
          authType: "github_app",
          githubAppInstallationRecordId: installationRecord.id,
          githubAppInstallationId: params.installationId,
          githubAppInstallationAccountLogin: accountLogin,
          githubAppInstallationAccountType: accountType,
          githubAppRepositoryId: repository.id,
          displayName: repository.full_name,
          owner: repository.owner.login,
          repo: repository.name,
          defaultBranch: repository.default_branch,
          repositoryEnabled: true,
          encryptedWebhookSecret,
          enabled: true,
        })
        .returning({ id: githubIntegrations.id });

      if (!createdIntegration) {
        throw new Error("Failed to create GitHub App integration");
      }

      await tx
        .insert(repositoryOutputs)
        .values(getDefaultRepositoryOutputs(createdIntegration.id));
      ids.push(createdIntegration.id);
    }

    return ids;
  });

  const integrations = await Promise.all(
    createdIds.map((id) => getGitHubIntegrationById(id))
  );

  return integrations.filter((integration) => integration !== null);
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

  return (await resolveAuthTokenForIntegration(integration)) ?? null;
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
      authType: integration.authType,
      githubAppInstallationId: integration.githubAppInstallationId,
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
  data: {
    enabled?: boolean;
    displayName?: string;
    owner?: string;
    repo?: string;
  }
) {
  const [updated] = await db
    .update(githubIntegrations)
    .set(data)
    .where(eq(githubIntegrations.id, integrationId))
    .returning();

  return updated;
}

export async function updateGitHubIntegrationToken(
  integrationId: string,
  token: string
) {
  const integration = await getGitHubIntegrationById(integrationId);

  if (!integration) {
    throw new Error("Integration not found");
  }

  const owner = integration.owner?.trim();
  const repo = integration.repo?.trim();

  if (!owner || !repo) {
    throw new Error("Repository not configured for this integration");
  }

  const normalizedToken = token.trim();

  if (integration.encryptedToken) {
    const currentToken = decryptToken(integration.encryptedToken);

    if (currentToken === normalizedToken) {
      return integration;
    }
  }

  const octokit = createOctokit(normalizedToken);

  try {
    await octokit.request("GET /user");
  } catch (_error) {
    throw new Error("Invalid GitHub token");
  }

  try {
    await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    });
  } catch (_error) {
    throw new Error(`Token does not have access to ${owner}/${repo}`);
  }

  const encryptedToken = encryptToken(normalizedToken);

  const [updated] = await db
    .update(githubIntegrations)
    .set({ encryptedToken })
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
  const {
    owner,
    repo,
    branch,
    token,
    encryptedToken,
    authType,
    githubAppInstallationId,
  } = params;

  const normalizedBranch = branch.trim();
  if (!normalizedBranch) {
    return;
  }

  const resolvedToken = token?.trim() || undefined;
  const authToken =
    resolvedToken ??
    (await resolveAuthTokenForIntegration({
      encryptedToken,
      authType,
      githubAppInstallationId,
    }));
  const octokit = createOctokit(authToken);

  try {
    await octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
      owner,
      repo,
      branch: normalizedBranch,
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
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
  const integration = await getGitHubIntegrationById(integrationId);

  if (integration?.authType === "github_app") {
    if (!integration.githubAppInstallationId) {
      return [];
    }

    return listGitHubAppRepositories(integration.githubAppInstallationId);
  }

  const token = await getDecryptedToken(integrationId, userId);

  if (!token) {
    return [];
  }

  const octokit = createOctokit(token);

  const { data } = await octokit.request("GET /user/repos", {
    per_page: 100,
    sort: "updated",
    headers: {
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
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
      authType: githubIntegrations.authType,
      githubAppInstallationId: githubIntegrations.githubAppInstallationId,
      integrationEnabled: githubIntegrations.enabled,
      repositoryEnabled: githubIntegrations.repositoryEnabled,
    })
    .from(githubIntegrations)
    .where(and(...whereClauses))
    .limit(1);

  if (!(integration?.integrationEnabled && integration.repositoryEnabled)) {
    return undefined;
  }

  return resolveAuthTokenForIntegration(integration);
}

export async function getTokenForIntegrationId(integrationId: string) {
  const integration = await db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, integrationId),
  });

  if (!integration) {
    return null;
  }

  return (await resolveAuthTokenForIntegration(integration)) ?? null;
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
      authType: githubIntegrations.authType,
      githubAppInstallationId: githubIntegrations.githubAppInstallationId,
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
    token: await resolveAuthTokenForIntegration(integration),
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
