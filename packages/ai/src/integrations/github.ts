import crypto from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  githubAppInstallations,
  githubIntegrations,
  members,
  repositoryOutputs,
} from "@notra/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Effect } from "effect";
import { customAlphabet } from "nanoid";
import { GITHUB_APP_REPOSITORIES_CACHE_TTL_SECONDS } from "../constants/github-app";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import {
  decodeCachedGitHubAppRepositories,
  decodeGitHubAppInstallationResponse,
  decodeGitHubAppRepositoriesResponse,
  type GitHubAppRepository,
  type GitHubAppRepositoryResponse,
} from "../schemas/github-app";
import type {
  AddRepositoryParams,
  ConfigureOutputParams,
  CreateGitHubIntegrationParams,
  ErrorWithStatus,
  ValidateRepositoryBranchExistsParams,
  WebhookConfig,
} from "../types/integrations";
import type { GitHubToolRepositoryContext } from "../types/tools";
import { createOctokit } from "../utils/octokit";
import { redis } from "../utils/redis";
import { getConfiguredAppUrl } from "../utils/url";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export class GitHubBranchNotFoundError extends Error {
  constructor(owner: string, repo: string, branch: string) {
    super(`Branch "${branch}" does not exist in ${owner}/${repo}`);
    this.name = "GitHubBranchNotFoundError";
  }
}

export class GitHubAppNotConfiguredError extends Error {
  constructor() {
    super("GitHub App is not configured");
    this.name = "GitHubAppNotConfiguredError";
  }
}

function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

function base64url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getGitHubAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const slug = process.env.GITHUB_APP_SLUG ?? process.env.GITHUB_APP_NAME;

  if (!(appId && privateKey && slug)) {
    throw new GitHubAppNotConfiguredError();
  }

  return { appId, privateKey, slug };
}

function createGitHubAppJwt() {
  const { appId, privateKey } = getGitHubAppConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    })
  );
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${payload}.${signature}`;
}

async function createGitHubAppInstallationToken(installationId: string) {
  const octokit = createOctokit(createGitHubAppJwt());
  const { data } = await octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    {
      installation_id: Number(installationId),
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return data.token;
}

async function getGitHubAppInstallation(installationId: string) {
  const octokit = createOctokit(createGitHubAppJwt());
  const { data } = await octokit.request(
    "GET /app/installations/{installation_id}",
    {
      installation_id: Number(installationId),
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return Effect.runPromise(decodeGitHubAppInstallationResponse(data));
}

async function insertDefaultRepositoryOutputs(repositoryId: string) {
  await db.insert(repositoryOutputs).values([
    {
      id: nanoid(),
      repositoryId,
      outputType: "changelog",
      enabled: true,
      config: null,
    },
    {
      id: nanoid(),
      repositoryId,
      outputType: "blog_post",
      enabled: false,
      config: null,
    },
    {
      id: nanoid(),
      repositoryId,
      outputType: "twitter_post",
      enabled: false,
      config: null,
    },
  ]);
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
}) {
  const { owner, repo, token, encryptedToken } = params;
  const resolvedToken =
    token?.trim() ||
    (encryptedToken ? decryptToken(encryptedToken) : undefined);
  const octokit = createOctokit(resolvedToken);

  try {
    await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
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

export function getGitHubAppInstallUrl(state: string) {
  const { slug } = getGitHubAppConfig();
  const installUrl = new URL(
    `https://github.com/apps/${slug}/installations/select_target`
  );
  installUrl.searchParams.set("state", state);
  return installUrl.toString();
}

export async function upsertGitHubAppInstallation(params: {
  organizationId: string;
  userId: string;
  installationId: string;
}) {
  const hasAccess = await validateUserOrgAccess(
    params.userId,
    params.organizationId
  );
  if (!hasAccess) {
    throw new Error("User does not have access to this organization");
  }

  const installation = await getGitHubAppInstallation(params.installationId);
  if (!installation.account) {
    throw new Error("GitHub installation account is missing");
  }

  const values = {
    id: nanoid(),
    organizationId: params.organizationId,
    createdByUserId: params.userId,
    installationId: String(installation.id),
    accountId: String(installation.account.id),
    accountLogin: installation.account.login,
    accountName: installation.account.name ?? null,
    accountAvatarUrl: installation.account.avatar_url,
    accountType: installation.account.type,
    repositorySelection: installation.repository_selection ?? null,
    enabled: true,
  };

  const [record] = await db
    .insert(githubAppInstallations)
    .values(values)
    .onConflictDoUpdate({
      target: [
        githubAppInstallations.organizationId,
        githubAppInstallations.installationId,
      ],
      set: {
        accountId: values.accountId,
        accountLogin: values.accountLogin,
        accountName: values.accountName,
        accountAvatarUrl: values.accountAvatarUrl,
        accountType: values.accountType,
        repositorySelection: values.repositorySelection,
        enabled: true,
      },
    })
    .returning();

  if (!record) {
    throw new Error("Failed to save GitHub App installation");
  }

  return record;
}

export async function getGitHubAppInstallationByOrganization(
  organizationId: string
) {
  return db.query.githubAppInstallations.findFirst({
    where: and(
      eq(githubAppInstallations.organizationId, organizationId),
      eq(githubAppInstallations.enabled, true)
    ),
  });
}

export async function listGitHubAppRepositories(organizationId: string) {
  const installation =
    await getGitHubAppInstallationByOrganization(organizationId);

  if (!installation) {
    return [];
  }

  const cacheKey = `github_app_repositories:${organizationId}:${installation.installationId}`;
  if (redis) {
    const cached = await redis.get(cacheKey);
    const decodedCached = await Effect.runPromise(
      decodeCachedGitHubAppRepositories(cached).pipe(
        Effect.match({
          onFailure: () => null,
          onSuccess: (repositories) => repositories,
        })
      )
    );

    if (decodedCached) {
      return decodedCached;
    }
  }

  const token = await createGitHubAppInstallationToken(
    installation.installationId
  );
  const octokit = createOctokit(token);
  const repositories: GitHubAppRepositoryResponse[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.request("GET /installation/repositories", {
      per_page: 100,
      page,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const response = await Effect.runPromise(
      decodeGitHubAppRepositoriesResponse(data)
    );
    repositories.push(...response.repositories);

    if (response.repositories.length < 100) {
      break;
    }
    page += 1;
  }

  const mappedRepositories: GitHubAppRepository[] = repositories.map(
    (repo) => ({
      id: String(repo.id),
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      defaultBranch: repo.default_branch,
    })
  );

  await redis?.set(cacheKey, mappedRepositories, {
    ex: GITHUB_APP_REPOSITORIES_CACHE_TTL_SECONDS,
  });

  return mappedRepositories;
}

export async function getSelectedGitHubAppRepositoryIds(
  organizationId: string,
  installationId: string
) {
  const selected = await db.query.githubIntegrations.findMany({
    where: and(
      eq(githubIntegrations.organizationId, organizationId),
      eq(githubIntegrations.githubAppInstallationId, installationId),
      eq(githubIntegrations.enabled, true)
    ),
    columns: {
      githubRepositoryId: true,
    },
  });

  return selected
    .map((repo) => repo.githubRepositoryId)
    .filter((id): id is string => Boolean(id));
}

export async function setSelectedGitHubAppRepositories(params: {
  organizationId: string;
  userId: string;
  repositoryIds: string[];
}) {
  const installation = await getGitHubAppInstallationByOrganization(
    params.organizationId
  );

  if (!installation) {
    throw new Error("GitHub App installation not found");
  }

  const repositories = await listGitHubAppRepositories(params.organizationId);
  const repositoryById = new Map(repositories.map((repo) => [repo.id, repo]));
  const selectedRepositories = params.repositoryIds.map((repositoryId) => {
    const repository = repositoryById.get(repositoryId);
    if (!repository) {
      throw new Error(
        "Selected repository is not available to this installation"
      );
    }
    return repository;
  });

  const existing = await db.query.githubIntegrations.findMany({
    where: and(
      eq(githubIntegrations.organizationId, params.organizationId),
      eq(
        githubIntegrations.githubAppInstallationId,
        installation.installationId
      )
    ),
    columns: {
      id: true,
      githubRepositoryId: true,
    },
  });
  const existingByRepositoryId = new Map(
    existing
      .filter((repo) => repo.githubRepositoryId)
      .map((repo) => [repo.githubRepositoryId as string, repo.id])
  );

  const selectedIds = new Set(params.repositoryIds);
  const deselectedIds = existing
    .filter(
      (repo) =>
        repo.githubRepositoryId && !selectedIds.has(repo.githubRepositoryId)
    )
    .map((repo) => repo.id);

  if (deselectedIds.length > 0) {
    await db
      .update(githubIntegrations)
      .set({
        enabled: false,
        repositoryEnabled: false,
      })
      .where(inArray(githubIntegrations.id, deselectedIds));
  }

  for (const repository of selectedRepositories) {
    const existingIntegrationId = existingByRepositoryId.get(repository.id);

    if (existingIntegrationId) {
      await db
        .update(githubIntegrations)
        .set({
          displayName: repository.fullName,
          owner: repository.owner,
          repo: repository.name,
          defaultBranch: repository.defaultBranch,
          githubRepositoryPrivate: repository.private,
          repositoryEnabled: true,
          enabled: true,
        })
        .where(eq(githubIntegrations.id, existingIntegrationId));
      continue;
    }

    const webhookSecret = generateWebhookSecret();
    const [created] = await db
      .insert(githubIntegrations)
      .values({
        id: nanoid(),
        organizationId: params.organizationId,
        createdByUserId: params.userId,
        displayName: repository.fullName,
        encryptedToken: null,
        githubAppInstallationId: installation.installationId,
        githubRepositoryId: repository.id,
        githubRepositoryPrivate: repository.private,
        owner: repository.owner,
        repo: repository.name,
        defaultBranch: repository.defaultBranch,
        repositoryEnabled: true,
        encryptedWebhookSecret: encryptToken(webhookSecret),
        enabled: true,
      })
      .returning();

    if (created) {
      await insertDefaultRepositoryOutputs(created.id);
    }
  }

  await redis?.del(
    `github_app_repositories:${params.organizationId}:${installation.installationId}`
  );

  return {
    selectedRepositoryIds: params.repositoryIds,
  };
}

export async function deleteGitHubAppInstallationForOrganization(
  organizationId: string
) {
  const installation =
    await getGitHubAppInstallationByOrganization(organizationId);

  if (!installation) {
    return;
  }

  await db
    .update(githubIntegrations)
    .set({
      enabled: false,
      repositoryEnabled: false,
    })
    .where(
      and(
        eq(githubIntegrations.organizationId, organizationId),
        eq(
          githubIntegrations.githubAppInstallationId,
          installation.installationId
        )
      )
    );

  await db
    .update(githubAppInstallations)
    .set({ enabled: false })
    .where(eq(githubAppInstallations.id, installation.id));

  await redis?.del(
    `github_app_repositories:${organizationId}:${installation.installationId}`
  );
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
        "X-GitHub-Api-Version": "2022-11-28",
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
  const { owner, repo, branch, token, encryptedToken } = params;

  const normalizedBranch = branch.trim();
  if (!normalizedBranch) {
    return;
  }

  const resolvedToken = token?.trim() || undefined;
  const authToken =
    resolvedToken ??
    (encryptedToken ? decryptToken(encryptedToken) : undefined);
  const octokit = createOctokit(authToken);

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

  if (integration.githubAppInstallationId) {
    return createGitHubAppInstallationToken(
      integration.githubAppInstallationId
    );
  }

  if (!integration.encryptedToken) {
    return undefined;
  }

  return decryptToken(integration.encryptedToken);
}

export async function getTokenForIntegrationId(integrationId: string) {
  const integration = await db.query.githubIntegrations.findFirst({
    where: eq(githubIntegrations.id, integrationId),
  });

  if (integration?.githubAppInstallationId) {
    return createGitHubAppInstallationToken(
      integration.githubAppInstallationId
    );
  }

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

  let token: string | undefined;

  if (integration.githubAppInstallationId) {
    token = await createGitHubAppInstallationToken(
      integration.githubAppInstallationId
    );
  } else if (integration.encryptedToken) {
    token = decryptToken(integration.encryptedToken);
  }

  return {
    integrationId: integration.id,
    organizationId: integration.organizationId,
    owner,
    repo,
    defaultBranch: integration.defaultBranch,
    token,
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
