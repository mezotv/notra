import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  githubIntegrations,
  linearIntegrations,
  repositoryOutputs,
} from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";

import {
  createGitHubIntegrationRequestSchema,
  createGitHubIntegrationResponseSchema,
  deleteIntegrationResponseSchema,
  getIntegrationParamsSchema,
  getIntegrationsResponseSchema,
} from "../schemas/content";
import { getOrganizationId } from "../utils/auth";
import {
  encryptGitHubIntegrationToken,
  findMatchingGitHubIntegration,
  generateGitHubIntegrationId,
  generateGitHubWebhookSecret,
  getGitHubIntegrationCreatorUserId,
  getSafeGitHubIntegrationErrorMessage,
  isGitHubIntegrationUnavailableError,
  validateGitHubRepositoryAccess,
} from "../utils/github-integrations";
import { errorResponse } from "../utils/openapi-responses";
import { getOrganizationResponse } from "../utils/organizations";
import { isConstraintViolation, isPgUniqueViolation } from "../utils/pg-errors";
import {
  deleteQstashSchedulesForTriggers,
  disableTriggersAndDeleteIntegration,
  getTriggersForIntegration,
} from "../utils/triggers";

export const integrationsRoutes = new OpenAPIHono();

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
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Organization not found"),
    503: errorResponse("Authentication service unavailable"),
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
    400: errorResponse(
      "Invalid request body or GitHub repository access error"
    ),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Organization not found"),
    409: errorResponse("Repository already connected"),
    503: errorResponse("Authentication or integration service unavailable"),
  },
});

const deleteIntegrationRoute = createRoute({
  method: "delete",
  path: "/integrations/{integrationId}",
  tags: ["Content"],
  operationId: "deleteIntegration",
  summary: "Delete a single integration",
  description:
    "Deletes a GitHub or Linear integration. Any automation triggers targeting a deleted GitHub integration are disabled.",
  request: {
    params: getIntegrationParamsSchema,
  },
  responses: {
    200: {
      description: "Integration deleted successfully",
      content: {
        "application/json": {
          schema: deleteIntegrationResponseSchema,
        },
      },
    },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Integration not found"),
    503: errorResponse("Authentication service unavailable"),
  },
});

integrationsRoutes.openapi(getIntegrationsRoute, async (c) => {
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

integrationsRoutes.openapi(createGitHubIntegrationRoute, async (c) => {
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

integrationsRoutes.openapi(deleteIntegrationRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const { integrationId } = c.req.valid("param");
  const runtimeEnv = (c.env ?? {}) as Record<string, unknown>;
  const db = c.get("db");
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const githubIntegration = await db.query.githubIntegrations.findFirst({
    where: and(
      eq(githubIntegrations.id, integrationId),
      eq(githubIntegrations.organizationId, orgId)
    ),
    columns: {
      id: true,
    },
  });

  if (githubIntegration) {
    const affectedTriggers = await getTriggersForIntegration(
      db,
      orgId,
      integrationId
    );

    await disableTriggersAndDeleteIntegration(
      db,
      orgId,
      affectedTriggers,
      (tx) =>
        tx
          .delete(githubIntegrations)
          .where(
            and(
              eq(githubIntegrations.id, integrationId),
              eq(githubIntegrations.organizationId, orgId)
            )
          )
    );

    await deleteQstashSchedulesForTriggers(runtimeEnv, affectedTriggers);

    return c.json(
      {
        id: integrationId,
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
  }

  const [existingLinearIntegration] = await db
    .select({ id: linearIntegrations.id })
    .from(linearIntegrations)
    .where(
      and(
        eq(linearIntegrations.id, integrationId),
        eq(linearIntegrations.organizationId, orgId)
      )
    )
    .limit(1);

  if (!existingLinearIntegration) {
    return c.json({ error: "Integration not found" }, 404);
  }

  const affectedTriggers = await getTriggersForIntegration(
    db,
    orgId,
    integrationId
  );

  await disableTriggersAndDeleteIntegration(db, orgId, affectedTriggers, (tx) =>
    tx
      .delete(linearIntegrations)
      .where(
        and(
          eq(linearIntegrations.id, integrationId),
          eq(linearIntegrations.organizationId, orgId)
        )
      )
  );

  await deleteQstashSchedulesForTriggers(runtimeEnv, affectedTriggers);

  return c.json(
    {
      id: existingLinearIntegration.id,
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
