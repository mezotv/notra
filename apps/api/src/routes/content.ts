import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  createBrandAnalysisJob,
  createBrandAnalysisJobId,
  getBrandAnalysisJob,
  setBrandAnalysisJobStatus,
  updateBrandAnalysisJob,
} from "@notra/ai/jobs/brand-analysis";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import {
  appendContentGenerationJobEvent,
  createContentGenerationJob,
  createContentGenerationJobId,
  getContentGenerationJob,
  listContentGenerationJobEvents,
  setContentGenerationJobStatus,
  updateContentGenerationJob,
} from "@notra/content-generation/jobs";
import type { createDb } from "@notra/db/drizzle-http";
import {
  brandSettings,
  contentTriggers,
  githubIntegrations,
  linearIntegrations,
  organizations,
  posts,
  repositoryOutputs,
} from "@notra/db/schema";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";

import {
  ALL_POST_CONTENT_TYPES,
  ALL_POST_STATUSES,
  createBrandIdentityRequestSchema,
  createBrandIdentityResponseSchema,
  createGitHubIntegrationRequestSchema,
  createGitHubIntegrationResponseSchema,
  createPostGenerationRequestSchema,
  createPostGenerationResponseSchema,
  deleteBrandIdentityResponseSchema,
  deletePostResponseSchema,
  errorResponseSchema,
  generationQueueErrorResponseSchema,
  getBrandAnalysisJobParamsSchema,
  getBrandAnalysisJobResponseSchema,
  getBrandIdentitiesResponseSchema,
  getBrandIdentityParamsSchema,
  getBrandIdentityResponseSchema,
  getIntegrationsResponseSchema,
  getPostGenerationParamsSchema,
  getPostGenerationResponseSchema,
  getPostParamsSchema,
  getPostResponseSchema,
  getPostsOpenApiQuerySchema,
  getPostsParamsSchema,
  getPostsResponseSchema,
  patchBrandIdentityRequestSchema,
  patchBrandIdentityResponseSchema,
  patchPostRequestSchema,
  patchPostResponseSchema,
} from "../schemas/content";
import { addActiveGeneration } from "../utils/active-generations";
import { getOrganizationId } from "../utils/auth";
import {
  isBrandAnalysisConfigured,
  triggerBrandAnalysisWorkflow,
} from "../utils/brand-analysis";
import {
  isContentGenerationConfigured,
  triggerContentGenerationWorkflow,
} from "../utils/content-generation";
import {
  encryptGitHubIntegrationToken,
  findMatchingGitHubIntegration,
  generateGitHubIntegrationId,
  generateGitHubWebhookSecret,
  getGitHubIntegrationCreatorUserId,
  validateGitHubRepositoryAccess,
} from "../utils/github-integrations";
import {
  extractTitleFromMarkdown,
  renderMarkdownToHtml,
} from "../utils/markdown";
import { deleteQstashSchedule } from "../utils/qstash";
import { getRedis } from "../utils/redis";
import {
  ORGANIZATION_POST_PATH_REGEX,
  ORGANIZATION_POSTS_PATH_REGEX,
} from "../utils/regex";

export const contentRoutes = new OpenAPIHono();

type DbClient = ReturnType<typeof createDb>;

async function getOrganizationResponse(
  db: DbClient,
  organizationId: string
): Promise<{
  id: string;
  slug: string;
  name: string;
  logo: string | null;
} | null> {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: {
      id: true,
      slug: true,
      name: true,
      logo: true,
    },
  });

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    logo: organization.logo,
  };
}

function shouldApplyFilter(
  selectedValues: readonly string[],
  allValues: readonly string[]
) {
  return selectedValues.length < allValues.length;
}

function getContentGenerationUnavailableReason(runtimeEnv: {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  QSTASH_TOKEN?: string;
  WORKFLOW_BASE_URL?: string;
}) {
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

function getPgConstraintName(error: unknown) {
  if (!(typeof error === "object" && error !== null)) {
    return null;
  }

  if ("constraint_name" in error && typeof error.constraint_name === "string") {
    return error.constraint_name;
  }

  if ("constraint" in error && typeof error.constraint === "string") {
    return error.constraint;
  }

  if (
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null
  ) {
    if (
      "constraint_name" in error.cause &&
      typeof error.cause.constraint_name === "string"
    ) {
      return error.cause.constraint_name;
    }

    if (
      "constraint" in error.cause &&
      typeof error.cause.constraint === "string"
    ) {
      return error.cause.constraint;
    }
  }

  return null;
}

function isPgUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function isConstraintViolation(error: unknown, constraintName: string) {
  const resolvedConstraintName = getPgConstraintName(error);

  if (resolvedConstraintName === constraintName) {
    return true;
  }

  if (error instanceof Error) {
    return error.message.includes(constraintName);
  }

  return false;
}

function getSafeGitHubIntegrationErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const safeMessages = new Set([
    "Invalid GitHub token or insufficient repository access",
    "Unable to access repository. It may be private and require a Personal Access Token.",
    "Organization has no members available to own the integration",
  ]);

  return safeMessages.has(error.message) ? error.message : null;
}

function isGitHubIntegrationUnavailableError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.startsWith("GitHub integrations are unavailable:")
  );
}

function selectBrandIdentityColumns() {
  return {
    id: brandSettings.id,
    name: brandSettings.name,
    isDefault: brandSettings.isDefault,
    websiteUrl: brandSettings.websiteUrl,
    companyName: brandSettings.companyName,
    companyDescription: brandSettings.companyDescription,
    toneProfile: brandSettings.toneProfile,
    customTone: brandSettings.customTone,
    customInstructions: brandSettings.customInstructions,
    audience: brandSettings.audience,
    language: brandSettings.language,
    createdAt: brandSettings.createdAt,
    updatedAt: brandSettings.updatedAt,
  };
}

async function getTriggersForBrandIdentity(
  db: DbClient,
  organizationId: string,
  brandIdentityId: string
) {
  const allTriggers = await db.query.contentTriggers.findMany({
    where: eq(contentTriggers.organizationId, organizationId),
    columns: {
      id: true,
      name: true,
      sourceType: true,
      outputConfig: true,
      qstashScheduleId: true,
    },
  });

  return allTriggers.filter((trigger) => {
    const config = trigger.outputConfig as {
      brandVoiceId?: string;
    } | null;

    return config?.brandVoiceId === brandIdentityId;
  });
}

async function resolveRequestedRepositoryIds(
  db: ReturnType<typeof createDb>,
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

async function resolveRequestedLinearIntegrationIds(
  db: ReturnType<typeof createDb>,
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

async function resolveRequestedBrandVoiceId(
  db: ReturnType<typeof createDb>,
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

contentRoutes.get("/:organizationId/posts", async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const pathOrg = c.req.param("organizationId");
  if (orgId !== pathOrg) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_POSTS_PATH_REGEX,
    "/posts"
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

contentRoutes.get("/:organizationId/posts/:postId", async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const pathOrg = c.req.param("organizationId");
  const postId = c.req.param("postId");
  if (orgId !== pathOrg) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_POST_PATH_REGEX,
    `/posts/${postId}`
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

contentRoutes.patch("/:organizationId/posts/:postId", async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const pathOrg = c.req.param("organizationId");
  const postId = c.req.param("postId");
  if (orgId !== pathOrg) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_POST_PATH_REGEX,
    `/posts/${postId}`
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

const getPostsRoute = createRoute({
  method: "get",
  path: "/posts",
  tags: ["Content"],
  operationId: "listPosts",
  summary: "List posts",
  request: {
    params: getPostsParamsSchema,
    query: getPostsOpenApiQuerySchema,
  },
  responses: {
    200: {
      description: "Posts fetched successfully",
      content: {
        "application/json": {
          schema: getPostsResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params or query",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getPostRoute = createRoute({
  method: "get",
  path: "/posts/{postId}",
  tags: ["Content"],
  operationId: "getPost",
  summary: "Get a single post",
  request: {
    params: getPostParamsSchema,
  },
  responses: {
    200: {
      description: "Post fetched successfully",
      content: {
        "application/json": {
          schema: getPostResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Post or organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deletePostRoute = createRoute({
  method: "delete",
  path: "/posts/{postId}",
  tags: ["Content"],
  operationId: "deletePost",
  summary: "Delete a single post",
  request: {
    params: getPostParamsSchema,
  },
  responses: {
    200: {
      description: "Post deleted successfully",
      content: {
        "application/json": {
          schema: deletePostResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Post not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Post slug already exists",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const patchPostRoute = createRoute({
  method: "patch",
  path: "/posts/{postId}",
  tags: ["Content"],
  operationId: "updatePost",
  summary: "Update a single post",
  request: {
    params: getPostParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: patchPostRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Post updated successfully",
      content: {
        "application/json": {
          schema: patchPostResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params or request body",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Post not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Post slug already exists",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const createPostGenerationRoute = createRoute({
  method: "post",
  path: "/posts/generate",
  tags: ["Content"],
  operationId: "createPostGeneration",
  summary: "Queue async post generation",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPostGenerationRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    202: {
      description: "Post generation queued successfully",
      content: {
        "application/json": {
          schema: createPostGenerationResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request body",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Content generation is unavailable",
      content: {
        "application/json": {
          schema: generationQueueErrorResponseSchema,
        },
      },
    },
  },
});

const getBrandIdentitiesRoute = createRoute({
  method: "get",
  path: "/brand-identities",
  tags: ["Content"],
  operationId: "listBrandIdentities",
  summary: "List available brand identities",
  responses: {
    200: {
      description: "Brand identities fetched successfully",
      content: {
        "application/json": {
          schema: getBrandIdentitiesResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const createBrandIdentityRoute = createRoute({
  method: "post",
  path: "/brand-identities/generate",
  tags: ["Content"],
  operationId: "createBrandIdentity",
  summary: "Queue async brand identity generation",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createBrandIdentityRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    202: {
      description: "Brand identity generation queued successfully",
      content: {
        "application/json": {
          schema: createBrandIdentityResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request body",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Brand identity name already exists",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getBrandAnalysisJobRoute = createRoute({
  method: "get",
  path: "/brand-identities/generate/{jobId}",
  tags: ["Content"],
  operationId: "getBrandIdentityGeneration",
  summary: "Get async brand identity generation status",
  request: {
    params: getBrandAnalysisJobParamsSchema,
  },
  responses: {
    200: {
      description: "Brand identity generation status fetched successfully",
      content: {
        "application/json": {
          schema: getBrandAnalysisJobResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Brand identity analysis job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Brand analysis is unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getBrandIdentityRoute = createRoute({
  method: "get",
  path: "/brand-identities/{brandIdentityId}",
  tags: ["Content"],
  operationId: "getBrandIdentity",
  summary: "Get a single brand identity",
  request: {
    params: getBrandIdentityParamsSchema,
  },
  responses: {
    200: {
      description: "Brand identity fetched successfully",
      content: {
        "application/json": {
          schema: getBrandIdentityResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const patchBrandIdentityRoute = createRoute({
  method: "patch",
  path: "/brand-identities/{brandIdentityId}",
  tags: ["Content"],
  operationId: "updateBrandIdentity",
  summary: "Update a single brand identity",
  description:
    "Updates brand identity fields. Pass isDefault: true to make the target brand identity the organization's default.",
  request: {
    params: getBrandIdentityParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: patchBrandIdentityRequestSchema,
          examples: {
            setDefault: {
              summary: "Set as default",
              value: {
                isDefault: true,
              },
            },
            updateAndSetDefault: {
              summary: "Rename and set as default",
              value: {
                name: "Notra Marketing",
                isDefault: true,
              },
            },
            switchToPresetTone: {
              summary: "Switch custom tone to preset",
              value: {
                toneProfile: "Professional",
              },
            },
            setCustomTone: {
              summary: "Set custom tone",
              value: {
                customTone: "Warm, sharp, and opinionated",
              },
            },
          },
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Brand identity updated successfully",
      content: {
        "application/json": {
          schema: patchBrandIdentityResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path params or request body",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Brand identity not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Brand identity name already exists",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deleteBrandIdentityRoute = createRoute({
  method: "delete",
  path: "/brand-identities/{brandIdentityId}",
  tags: ["Content"],
  operationId: "deleteBrandIdentity",
  summary: "Delete a single brand identity",
  description:
    "Deletes a non-default brand identity and disables any automation triggers that reference it.",
  request: {
    params: getBrandIdentityParamsSchema,
  },
  responses: {
    200: {
      description: "Brand identity deleted successfully",
      content: {
        "application/json": {
          schema: deleteBrandIdentityResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot delete the default brand identity",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Brand identity not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getIntegrationsRoute = createRoute({
  method: "get",
  path: "/integrations",
  tags: ["Content"],
  operationId: "listIntegrations",
  summary: "List available integrations",
  responses: {
    200: {
      description: "Integrations fetched successfully",
      content: {
        "application/json": {
          schema: getIntegrationsResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const createGitHubIntegrationRoute = createRoute({
  method: "post",
  path: "/integrations/github",
  tags: ["Content"],
  operationId: "createGitHubIntegration",
  summary: "Create a GitHub integration",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createGitHubIntegrationRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "GitHub integration created successfully",
      content: {
        "application/json": {
          schema: createGitHubIntegrationResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request body or GitHub repository access error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Repository already connected",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Authentication or integration service unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getPostGenerationRoute = createRoute({
  method: "get",
  path: "/posts/generate/{jobId}",
  tags: ["Content"],
  operationId: "getPostGeneration",
  summary: "Get async post generation status",
  request: {
    params: getPostGenerationParamsSchema,
  },
  responses: {
    200: {
      description: "Post generation status fetched successfully",
      content: {
        "application/json": {
          schema: getPostGenerationResponseSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Generation job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: "Content generation is unavailable",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

contentRoutes.openapi(getPostsRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const query = c.req.valid("query");
  const db = c.get("db");
  const { limit, page, sort, status, contentType } = query;
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(posts.organizationId, orgId),
    shouldApplyFilter(status, ALL_POST_STATUSES)
      ? inArray(posts.status, status)
      : undefined,
    shouldApplyFilter(contentType, ALL_POST_CONTENT_TYPES)
      ? inArray(posts.contentType, contentType)
      : undefined
  );

  const [countResult] = await db
    .select({ totalItems: count(posts.id) })
    .from(posts)
    .where(whereClause);

  const totalItems = countResult?.totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const results = await db.query.posts.findMany({
    where: whereClause,
    orderBy: (table, { asc, desc }) =>
      sort === "asc"
        ? [asc(table.createdAt), asc(table.id)]
        : [desc(table.createdAt), desc(table.id)],
    limit,
    offset,
    columns: {
      id: true,
      title: true,
      slug: true,
      content: true,
      markdown: true,
      recommendations: true,
      contentType: true,
      sourceMetadata: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json(
    {
      posts: results,
      pagination: {
        limit,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        totalPages,
        totalItems,
      },
      organization,
    },
    200
  );
});

contentRoutes.openapi(getPostRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const params = c.req.valid("param");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, params.postId), eq(posts.organizationId, orgId)),
    columns: {
      id: true,
      title: true,
      slug: true,
      content: true,
      markdown: true,
      recommendations: true,
      contentType: true,
      sourceMetadata: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json(
    {
      post: post ?? null,
      organization,
    },
    200
  );
});

contentRoutes.openapi(deletePostRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { postId } = c.req.valid("param");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const [deletedPost] = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.organizationId, orgId)))
    .returning({ id: posts.id });

  if (!deletedPost) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json({ id: deletedPost.id, organization }, 200);
});

contentRoutes.openapi(patchPostRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { postId } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const existingPost = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.organizationId, orgId)),
    columns: {
      id: true,
      title: true,
      slug: true,
      contentType: true,
    },
  });

  if (!existingPost) {
    return c.json({ error: "Post not found" }, 404);
  }

  const updateData: Partial<typeof posts.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) {
    updateData.title = body.title;
  }

  if (body.slug !== undefined) {
    if (!supportsPostSlug(existingPost.contentType)) {
      return c.json(
        { error: "Slug can only be set for blog posts and changelogs" },
        400
      );
    }

    updateData.slug = body.slug;
  }

  if (body.markdown !== undefined) {
    let renderedContent: string;

    try {
      renderedContent = await renderMarkdownToHtml(body.markdown);
    } catch {
      return c.json({ error: "Invalid markdown content" }, 400);
    }

    updateData.markdown = body.markdown;
    updateData.content = renderedContent;

    if (body.title === undefined) {
      updateData.title =
        extractTitleFromMarkdown(body.markdown) ?? existingPost.title;
    }
  }

  if (body.status !== undefined) {
    updateData.status = body.status;
  }

  let updatedRows: Array<{
    id: string;
    title: string;
    slug: string | null;
    content: string;
    markdown: string;
    recommendations: string | null;
    contentType: string;
    sourceMetadata: unknown;
    status: "draft" | "published";
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    updatedRows = await db
      .update(posts)
      .set(updateData)
      .where(and(eq(posts.id, postId), eq(posts.organizationId, orgId)))
      .returning({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        markdown: posts.markdown,
        recommendations: posts.recommendations,
        contentType: posts.contentType,
        sourceMetadata: posts.sourceMetadata,
        status: posts.status,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      });
  } catch (error) {
    if (
      isPgUniqueViolation(error) &&
      isConstraintViolation(error, "posts_org_slug_uidx")
    ) {
      return c.json({ error: "A post with this slug already exists" }, 409);
    }

    throw error;
  }

  const [updatedPost] = updatedRows;

  if (!updatedPost) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json({ post: updatedPost, organization }, 200);
});

contentRoutes.openapi(createPostGenerationRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const runtimeEnv = c.env ?? {};
  const redis = getRedis(runtimeEnv);
  const unavailableReason = getContentGenerationUnavailableReason(runtimeEnv);
  if (
    !redis ||
    !isContentGenerationConfigured(runtimeEnv) ||
    unavailableReason
  ) {
    return c.json(
      { error: unavailableReason ?? "Content generation is unavailable" },
      503
    );
  }

  const body = c.req.valid("json");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  let repositoryIds: string[] | undefined;
  let linearIntegrationIds: string[] | undefined;
  let resolvedBrandVoiceId: string | null = null;
  const requestedIntegrations = {
    github: body.integrations?.github ?? body.repositoryIds,
    linear: body.integrations?.linear ?? body.linearIntegrationIds,
  };

  try {
    repositoryIds = await resolveRequestedRepositoryIds(db, orgId, {
      integrations: requestedIntegrations,
      github: body.github,
    });
    linearIntegrationIds = await resolveRequestedLinearIntegrationIds(
      db,
      orgId,
      {
        integrations: requestedIntegrations,
      }
    );
    resolvedBrandVoiceId = await resolveRequestedBrandVoiceId(
      db,
      orgId,
      body.brandIdentityId ?? body.brandVoiceId
    );
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to resolve requested repositories",
      },
      400
    );
  }

  const now = new Date().toISOString();
  const jobId = createContentGenerationJobId();

  const job = await createContentGenerationJob(redis, {
    id: jobId,
    organizationId: orgId,
    status: "queued",
    contentType: body.contentType,
    lookbackWindow: body.lookbackWindow,
    repositoryIds: repositoryIds ?? [],
    brandVoiceId: resolvedBrandVoiceId,
    workflowRunId: null,
    postId: null,
    error: null,
    source: "api",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });

  await addActiveGeneration(redis, orgId, {
    runId: jobId,
    triggerId: "api_on_demand",
    outputType: body.contentType,
    triggerName: body.contentType,
    startedAt: now,
    source: "api",
  });

  await appendContentGenerationJobEvent(redis, {
    id: crypto.randomUUID(),
    jobId,
    type: "queued",
    message: `Queued ${body.contentType.replaceAll("_", " ")} generation`,
    createdAt: now,
    metadata: {
      lookbackWindow: body.lookbackWindow,
      repositoryCount: repositoryIds?.length ?? 0,
      linearIntegrationCount: linearIntegrationIds?.length ?? 0,
    },
  });

  try {
    const workflowRunId = await triggerContentGenerationWorkflow(runtimeEnv, {
      organizationId: orgId,
      jobId,
      runId: jobId,
      contentType: body.contentType,
      lookbackWindow: body.lookbackWindow,
      repositoryIds,
      linearIntegrationIds,
      brandVoiceId: resolvedBrandVoiceId ?? undefined,
      dataPoints: body.dataPoints,
      selectedItems: body.selectedItems,
      aiCreditReserved: false,
      source: "api",
    });

    const updatedJob = await updateContentGenerationJob(redis, jobId, {
      workflowRunId,
    });

    await appendContentGenerationJobEvent(redis, {
      id: crypto.randomUUID(),
      jobId,
      type: "workflow_triggered",
      message: "Triggered content generation workflow",
      createdAt: new Date().toISOString(),
      metadata: { workflowRunId },
    });

    return c.json({ job: updatedJob ?? job, organization }, 202);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger workflow";

    const failedJob = await setContentGenerationJobStatus(
      redis,
      jobId,
      "failed",
      { error: message }
    );

    await appendContentGenerationJobEvent(redis, {
      id: crypto.randomUUID(),
      jobId,
      type: "failed",
      message,
      createdAt: new Date().toISOString(),
      metadata: null,
    });

    return c.json(
      {
        error: "Failed to queue content generation",
        ...(failedJob ? { jobId: failedJob.id } : {}),
      },
      503
    );
  }
});

contentRoutes.openapi(getBrandIdentitiesRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const brandIdentities = await db.query.brandSettings.findMany({
    where: eq(brandSettings.organizationId, orgId),
    orderBy: [desc(brandSettings.isDefault), asc(brandSettings.createdAt)],
    columns: {
      id: true,
      name: true,
      isDefault: true,
      websiteUrl: true,
      companyName: true,
      companyDescription: true,
      toneProfile: true,
      customTone: true,
      customInstructions: true,
      audience: true,
      language: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({ brandIdentities, organization }, 200);
});

contentRoutes.openapi(createBrandIdentityRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const body = c.req.valid("json");
  const runtimeEnv = c.env ?? {};
  const redis = getRedis(runtimeEnv);
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  if (!redis || !isBrandAnalysisConfigured(runtimeEnv)) {
    return c.json({ error: "Brand analysis is unavailable" }, 503);
  }

  const name = body.name?.trim() || "Untitled Brand Voice";
  const websiteUrl = body.websiteUrl;
  const newBrandIdentityId = crypto.randomUUID();
  const now = new Date().toISOString();
  const jobId = createBrandAnalysisJobId();

  const existingBrandIdentityWithName = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, orgId),
      eq(brandSettings.name, name)
    ),
    columns: { id: true },
  });

  if (existingBrandIdentityWithName) {
    return c.json(
      { error: "A brand identity with this name already exists" },
      409
    );
  }

  try {
    const hasAnyBrandIdentity = await db.query.brandSettings.findFirst({
      where: eq(brandSettings.organizationId, orgId),
      columns: { id: true },
    });

    const [brandIdentity] = await (async () => {
      try {
        return await db
          .insert(brandSettings)
          .values({
            id: newBrandIdentityId,
            organizationId: orgId,
            name,
            isDefault: !hasAnyBrandIdentity,
            websiteUrl,
          })
          .returning(selectBrandIdentityColumns());
      } catch (error) {
        if (!isConstraintViolation(error, "brandSettings_org_default_uidx")) {
          throw error;
        }

        return db
          .insert(brandSettings)
          .values({
            id: newBrandIdentityId,
            organizationId: orgId,
            name,
            isDefault: false,
            websiteUrl,
          })
          .returning(selectBrandIdentityColumns());
      }
    })();

    if (!brandIdentity) {
      throw new Error("Failed to create brand identity");
    }

    try {
      const job = await createBrandAnalysisJob(redis, {
        id: jobId,
        organizationId: orgId,
        brandIdentityId: brandIdentity.id,
        status: "queued",
        step: null,
        currentStep: 0,
        totalSteps: 3,
        workflowRunId: null,
        error: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      });

      const workflowRunId = await triggerBrandAnalysisWorkflow(runtimeEnv, {
        organizationId: orgId,
        url: websiteUrl,
        voiceId: brandIdentity.id,
        jobId,
      });

      const updatedJob = await updateBrandAnalysisJob(redis, jobId, {
        workflowRunId,
      });

      return c.json({ job: updatedJob ?? job, organization }, 202);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger workflow";

      await setBrandAnalysisJobStatus(redis, jobId, "failed", {
        step: null,
        currentStep: 0,
        totalSteps: 3,
        error: message,
      });

      await db
        .delete(brandSettings)
        .where(
          and(
            eq(brandSettings.id, brandIdentity.id),
            eq(brandSettings.organizationId, orgId)
          )
        );

      return c.json(
        {
          error: "Failed to queue brand identity analysis",
        },
        503
      );
    }
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      if (isConstraintViolation(error, "brandSettings_org_name_uidx")) {
        return c.json(
          { error: "A brand identity with this name already exists" },
          409
        );
      }

      return c.json({ error: "Failed to create brand identity" }, 409);
    }

    throw error;
  }
});

contentRoutes.openapi(getBrandAnalysisJobRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { jobId } = c.req.valid("param");
  const runtimeEnv = c.env ?? {};
  const redis = getRedis(runtimeEnv);
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  if (!redis) {
    return c.json({ error: "Brand analysis is unavailable" }, 503);
  }

  const job = await getBrandAnalysisJob(redis, jobId);

  if (!job || job.organizationId !== orgId) {
    return c.json({ error: "Brand identity analysis job not found" }, 404);
  }

  return c.json({ job, organization }, 200);
});

contentRoutes.openapi(getBrandIdentityRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { brandIdentityId } = c.req.valid("param");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const brandIdentity = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, brandIdentityId),
      eq(brandSettings.organizationId, orgId)
    ),
    columns: {
      id: true,
      name: true,
      isDefault: true,
      websiteUrl: true,
      companyName: true,
      companyDescription: true,
      toneProfile: true,
      customTone: true,
      customInstructions: true,
      audience: true,
      language: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({ brandIdentity: brandIdentity ?? null, organization }, 200);
});

contentRoutes.openapi(patchBrandIdentityRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { brandIdentityId } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const existingBrandIdentity = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, brandIdentityId),
      eq(brandSettings.organizationId, orgId)
    ),
    columns: { id: true },
  });

  if (!existingBrandIdentity) {
    return c.json({ error: "Brand identity not found" }, 404);
  }

  const updateData: Partial<typeof brandSettings.$inferInsert> = {
    updatedAt: new Date(),
  };
  const shouldSetDefault = body.isDefault === true;

  if (body.name !== undefined) {
    updateData.name = body.name;
  }

  if (body.websiteUrl !== undefined) {
    updateData.websiteUrl = body.websiteUrl;
  }

  if (body.companyName !== undefined) {
    updateData.companyName = body.companyName;
  }

  if (body.companyDescription !== undefined) {
    updateData.companyDescription = body.companyDescription;
  }

  if (body.toneProfile !== undefined) {
    updateData.toneProfile = body.toneProfile;
    if (body.customTone === undefined) {
      updateData.customTone = null;
    }
  }

  if (body.customTone !== undefined) {
    updateData.customTone = body.customTone?.trim() ? body.customTone : null;
  }

  if (body.customInstructions !== undefined) {
    updateData.customInstructions = body.customInstructions;
  }

  if (body.audience !== undefined) {
    updateData.audience = body.audience;
  }

  if (body.language !== undefined) {
    updateData.language = body.language;
  }

  try {
    const [brandIdentity] = shouldSetDefault
      ? await (async () => {
          const { updatedAt, ...targetUpdateData } = updateData;

          if (Object.keys(targetUpdateData).length > 0) {
            await db
              .update(brandSettings)
              .set(targetUpdateData)
              .where(
                and(
                  eq(brandSettings.id, brandIdentityId),
                  eq(brandSettings.organizationId, orgId)
                )
              );
          }

          await db
            .update(brandSettings)
            .set({ isDefault: false })
            .where(
              and(
                eq(brandSettings.organizationId, orgId),
                eq(brandSettings.isDefault, true),
                ne(brandSettings.id, brandIdentityId)
              )
            );

          return db
            .update(brandSettings)
            .set({ isDefault: true, updatedAt })
            .where(
              and(
                eq(brandSettings.id, brandIdentityId),
                eq(brandSettings.organizationId, orgId)
              )
            )
            .returning(selectBrandIdentityColumns());
        })()
      : await db
          .update(brandSettings)
          .set(updateData)
          .where(
            and(
              eq(brandSettings.id, brandIdentityId),
              eq(brandSettings.organizationId, orgId)
            )
          )
          .returning(selectBrandIdentityColumns());

    if (!brandIdentity) {
      return c.json({ error: "Brand identity not found" }, 404);
    }

    return c.json({ brandIdentity, organization }, 200);
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return c.json(
        { error: "A brand identity with this name already exists" },
        409
      );
    }

    throw error;
  }
});

contentRoutes.openapi(deleteBrandIdentityRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { brandIdentityId } = c.req.valid("param");
  const runtimeEnv = c.env ?? {};
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const brandIdentity = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, brandIdentityId),
      eq(brandSettings.organizationId, orgId)
    ),
    columns: {
      id: true,
      isDefault: true,
    },
  });

  if (!brandIdentity) {
    return c.json({ error: "Brand identity not found" }, 404);
  }

  if (brandIdentity.isDefault) {
    return c.json({ error: "Cannot delete the default brand identity" }, 400);
  }

  const affectedTriggers = await getTriggersForBrandIdentity(
    db,
    orgId,
    brandIdentityId
  );

  for (const trigger of affectedTriggers) {
    if (!trigger.qstashScheduleId) {
      continue;
    }

    await deleteQstashSchedule(runtimeEnv, trigger.qstashScheduleId).catch(
      (error) => {
        console.error(
          `Failed to delete qstash schedule ${trigger.qstashScheduleId}:`,
          error
        );
      }
    );
  }

  if (affectedTriggers.length > 0) {
    await db.batch([
      db
        .update(contentTriggers)
        .set({
          enabled: false,
          qstashScheduleId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contentTriggers.organizationId, orgId),
            inArray(
              contentTriggers.id,
              affectedTriggers.map((trigger) => trigger.id)
            )
          )
        ),
      db
        .delete(brandSettings)
        .where(
          and(
            eq(brandSettings.id, brandIdentityId),
            eq(brandSettings.organizationId, orgId)
          )
        ),
    ]);
  } else {
    await db.batch([
      db
        .delete(brandSettings)
        .where(
          and(
            eq(brandSettings.id, brandIdentityId),
            eq(brandSettings.organizationId, orgId)
          )
        ),
    ]);
  }

  return c.json(
    {
      id: brandIdentityId,
      organization,
      disabledSchedules: affectedTriggers
        .filter((trigger) => trigger.sourceType === "cron")
        .map((trigger) => ({ id: trigger.id, name: trigger.name })),
      disabledEvents: affectedTriggers
        .filter((trigger) => trigger.sourceType !== "cron")
        .map((trigger) => ({ id: trigger.id, name: trigger.name })),
    },
    200
  );
});

contentRoutes.openapi(getIntegrationsRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const github = await db.query.githubIntegrations.findMany({
    where: and(
      eq(githubIntegrations.organizationId, orgId),
      eq(githubIntegrations.enabled, true)
    ),
    orderBy: [asc(githubIntegrations.displayName), asc(githubIntegrations.id)],
    columns: {
      id: true,
      displayName: true,
      owner: true,
      repo: true,
      defaultBranch: true,
    },
  });

  const linear = await db.query.linearIntegrations.findMany({
    where: and(
      eq(linearIntegrations.organizationId, orgId),
      eq(linearIntegrations.enabled, true)
    ),
    orderBy: [asc(linearIntegrations.displayName), asc(linearIntegrations.id)],
    columns: {
      id: true,
      displayName: true,
      linearOrganizationId: true,
      linearOrganizationName: true,
      linearTeamId: true,
      linearTeamName: true,
    },
  });

  return c.json(
    {
      github,
      slack: [],
      linear,
      organization,
    },
    200
  );
});

contentRoutes.openapi(createGitHubIntegrationRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const body = c.req.valid("json");
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const owner = body.owner.trim();
  const repo = body.repo.trim();
  const branch = body.branch?.trim() || null;
  const token = body.token?.trim() || null;

  try {
    const existingIntegration = await findMatchingGitHubIntegration(
      db,
      orgId,
      owner,
      repo
    );

    if (existingIntegration) {
      return c.json({ error: "Repository already connected" }, 409);
    }

    await validateGitHubRepositoryAccess({ owner, repo, token });

    const integrationId = generateGitHubIntegrationId();
    const createdByUserId = await getGitHubIntegrationCreatorUserId(db, orgId);
    const encryptedToken = token
      ? encryptGitHubIntegrationToken(token, c.env ?? {})
      : null;
    const encryptedWebhookSecret = encryptGitHubIntegrationToken(
      generateGitHubWebhookSecret(),
      c.env ?? {}
    );

    const integration = await db.transaction(async (tx) => {
      const [createdIntegration] = await tx
        .insert(githubIntegrations)
        .values({
          id: integrationId,
          organizationId: orgId,
          createdByUserId,
          encryptedToken,
          displayName: `${owner}/${repo}`,
          owner,
          repo,
          defaultBranch: branch,
          repositoryEnabled: true,
          encryptedWebhookSecret,
          enabled: true,
        })
        .returning({
          id: githubIntegrations.id,
          displayName: githubIntegrations.displayName,
          owner: githubIntegrations.owner,
          repo: githubIntegrations.repo,
          defaultBranch: githubIntegrations.defaultBranch,
        });

      if (!createdIntegration) {
        throw new Error("Failed to create GitHub integration record");
      }

      await tx.insert(repositoryOutputs).values([
        {
          id: generateGitHubIntegrationId(),
          repositoryId: integrationId,
          outputType: "changelog",
          enabled: true,
          config: null,
        },
        {
          id: generateGitHubIntegrationId(),
          repositoryId: integrationId,
          outputType: "blog_post",
          enabled: false,
          config: null,
        },
        {
          id: generateGitHubIntegrationId(),
          repositoryId: integrationId,
          outputType: "twitter_post",
          enabled: false,
          config: null,
        },
      ]);

      return createdIntegration;
    });

    if (!integration) {
      return c.json({ error: "Failed to create integration" }, 503);
    }

    return c.json({ github: integration, organization }, 201);
  } catch (error) {
    if (isGitHubIntegrationUnavailableError(error)) {
      return c.json({ error: "GitHub integrations are unavailable" }, 503);
    }

    if (
      isPgUniqueViolation(error) ||
      isConstraintViolation(
        error,
        "githubIntegrations_organization_owner_repo_uidx"
      )
    ) {
      return c.json({ error: "Repository already connected" }, 409);
    }

    const safeMessage = getSafeGitHubIntegrationErrorMessage(error);

    if (safeMessage) {
      return c.json({ error: safeMessage }, 400);
    }

    console.error("Failed to create GitHub integration", error);

    return c.json(
      {
        error: "Failed to create GitHub integration",
      },
      400
    );
  }
});

contentRoutes.openapi(getPostGenerationRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const redis = getRedis(c.env ?? {});
  const unavailableReason = getContentGenerationUnavailableReason(c.env ?? {});
  if (!redis || unavailableReason) {
    return c.json(
      { error: unavailableReason ?? "Content generation is unavailable" },
      503
    );
  }

  const { jobId } = c.req.valid("param");
  const job = await getContentGenerationJob(redis, jobId);

  if (!job) {
    return c.json({ error: "Generation job not found" }, 404);
  }

  if (job.organizationId !== orgId) {
    return c.json({ error: "Forbidden: organization access denied" }, 403);
  }

  const events = await listContentGenerationJobEvents(redis, jobId);
  return c.json({ job, events }, 200);
});
