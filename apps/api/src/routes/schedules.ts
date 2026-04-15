import crypto from "node:crypto";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { createDb } from "@notra/db/drizzle-http";
import {
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
} from "@notra/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import {
  createScheduleRequestSchema,
  deleteScheduleResponseSchema,
  getSchedulesQuerySchema,
  getSchedulesResponseSchema,
  patchScheduleRequestSchema,
  scheduleOutputConfigSchema,
  scheduleParamsSchema,
  scheduleResponseSchema,
  scheduleSourceConfigSchema,
  scheduleTargetsSchema,
} from "../schemas/schedules";
import { getOrganizationId } from "../utils/auth";
import { errorResponse } from "../utils/openapi-responses";
import { getOrganizationResponse } from "../utils/organizations";
import {
  buildCronExpression,
  createQstashSchedule,
  deleteQstashSchedule,
} from "../utils/qstash";
import {
  ORGANIZATION_SCHEDULE_PATH_REGEX,
  ORGANIZATION_SCHEDULES_PATH_REGEX,
} from "../utils/regex";

export const schedulesRoutes = new OpenAPIHono();

type DbClient = ReturnType<typeof createDb>;
type CreateScheduleBody = z.infer<typeof createScheduleRequestSchema>;
type ScheduleLookbackWindow = CreateScheduleBody["lookbackWindow"];

const DEFAULT_SCHEDULE_NAME = "Untitled Schedule";

function normalizeCronConfig(
  config: CreateScheduleBody["sourceConfig"]["cron"]
) {
  const base = {
    frequency: config.frequency,
    hour: config.hour,
    minute: config.minute,
  } as const;

  if (config.frequency === "weekly") {
    return {
      ...base,
      dayOfWeek: config.dayOfWeek ?? 1,
    };
  }

  if (config.frequency === "monthly") {
    return {
      ...base,
      dayOfMonth: config.dayOfMonth ?? 1,
    };
  }

  return base;
}

function normalizeSchedule(input: CreateScheduleBody) {
  return {
    ...input,
    sourceConfig: {
      cron: normalizeCronConfig(input.sourceConfig.cron),
    },
    targets: {
      repositoryIds: [...input.targets.repositoryIds].sort(),
    },
  };
}

function hashSchedule(input: CreateScheduleBody) {
  const normalized = normalizeSchedule(input);

  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        sourceType: normalized.sourceType,
        sourceConfig: normalized.sourceConfig,
        targets: normalized.targets,
        outputType: normalized.outputType,
        outputConfig: normalized.outputConfig ?? null,
        lookbackWindow: normalized.lookbackWindow,
      })
    )
    .digest("hex");
}

async function ensureScheduleTargetsExist(
  db: DbClient,
  organizationId: string,
  repositoryIds: string[],
  message: string
) {
  if (repositoryIds.length === 0) {
    return null;
  }

  const integrations = await db.query.githubIntegrations.findMany({
    where: and(
      eq(githubIntegrations.organizationId, organizationId),
      inArray(githubIntegrations.id, repositoryIds)
    ),
    columns: { id: true },
  });

  const existingIds = new Set(
    integrations.map((integration) => integration.id)
  );
  const missingIds = repositoryIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    return { error: message, missingIntegrationIds: missingIds };
  }

  return null;
}

function serializeSchedule(trigger: {
  id: string;
  organizationId: string;
  name: string;
  sourceType: string;
  sourceConfig: unknown;
  targets: unknown;
  outputType: string;
  outputConfig: unknown;
  enabled: boolean;
  autoPublish: boolean;
  createdAt: Date;
  updatedAt: Date;
  lookbackWindow: ScheduleLookbackWindow;
}) {
  return {
    id: trigger.id,
    organizationId: trigger.organizationId,
    name: trigger.name,
    sourceType: "cron" as const,
    sourceConfig: scheduleSourceConfigSchema.parse(trigger.sourceConfig),
    targets: scheduleTargetsSchema.parse(trigger.targets),
    outputType: createScheduleRequestSchema.shape.outputType.parse(
      trigger.outputType
    ),
    outputConfig:
      trigger.outputConfig == null
        ? null
        : scheduleOutputConfigSchema.parse(trigger.outputConfig),
    enabled: trigger.enabled,
    autoPublish: trigger.autoPublish,
    createdAt: trigger.createdAt.toISOString(),
    updatedAt: trigger.updatedAt.toISOString(),
    lookbackWindow: trigger.lookbackWindow,
  };
}

function mapQstashError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (
    message.includes("invalid destination") ||
    message.includes("unable to resolve host") ||
    message.includes("WORKFLOW_BASE_URL is not configured")
  ) {
    return { error: "External URL not configured", status: 400 as const };
  }

  return { error: "Failed to configure schedule", status: 500 as const };
}

function filterByRepositoryIds<T extends { targets: unknown }>(
  triggers: T[],
  repositoryIds: string[]
) {
  if (repositoryIds.length === 0) {
    return triggers;
  }

  const repositoryIdSet = new Set(repositoryIds);

  return triggers.filter((trigger) => {
    const parsed = z
      .object({ repositoryIds: z.array(z.string()) })
      .safeParse(trigger.targets);

    if (!parsed.success) {
      return false;
    }

    return parsed.data.repositoryIds.some((repositoryId) =>
      repositoryIdSet.has(repositoryId)
    );
  });
}

schedulesRoutes.get("/:organizationId/schedules", async (c) => {
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
    ORGANIZATION_SCHEDULES_PATH_REGEX,
    "/schedules"
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

schedulesRoutes.post("/:organizationId/schedules", async (c) => {
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
    ORGANIZATION_SCHEDULES_PATH_REGEX,
    "/schedules"
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

schedulesRoutes.patch("/:organizationId/schedules/:scheduleId", async (c) => {
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

  const scheduleId = c.req.param("scheduleId");
  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_SCHEDULE_PATH_REGEX,
    `/schedules/${scheduleId}`
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

schedulesRoutes.delete("/:organizationId/schedules/:scheduleId", async (c) => {
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

  const scheduleId = c.req.param("scheduleId");
  const url = new URL(c.req.url);
  const canonicalPath = url.pathname.replace(
    ORGANIZATION_SCHEDULE_PATH_REGEX,
    `/schedules/${scheduleId}`
  );
  return c.redirect(`${canonicalPath}${url.search}`, 308);
});

const getSchedulesRoute = createRoute({
  method: "get",
  path: "/schedules",
  tags: ["Schedules"],
  operationId: "listSchedules",
  summary: "List schedules",
  request: {
    query: getSchedulesQuerySchema,
  },
  responses: {
    200: {
      description: "Schedules fetched successfully",
      content: {
        "application/json": {
          schema: getSchedulesResponseSchema,
        },
      },
    },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Organization not found"),
  },
});

const createScheduleRoute = createRoute({
  method: "post",
  path: "/schedules",
  tags: ["Schedules"],
  operationId: "createSchedule",
  summary: "Create a schedule",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createScheduleRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Schedule created successfully",
      content: {
        "application/json": {
          schema: scheduleResponseSchema,
        },
      },
    },
    400: errorResponse("Invalid request"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Organization not found"),
    409: errorResponse("Duplicate schedule"),
    500: errorResponse("Failed to create schedule"),
  },
});

const patchScheduleRoute = createRoute({
  method: "patch",
  path: "/schedules/{scheduleId}",
  tags: ["Schedules"],
  operationId: "updateSchedule",
  summary: "Update a schedule",
  request: {
    params: scheduleParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: patchScheduleRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Schedule updated successfully",
      content: {
        "application/json": {
          schema: scheduleResponseSchema,
        },
      },
    },
    400: errorResponse("Invalid request"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Schedule or organization not found"),
    409: errorResponse("Duplicate schedule"),
    500: errorResponse("Failed to update schedule"),
  },
});

const deleteScheduleRoute = createRoute({
  method: "delete",
  path: "/schedules/{scheduleId}",
  tags: ["Schedules"],
  operationId: "deleteSchedule",
  summary: "Delete a schedule",
  request: {
    params: scheduleParamsSchema,
  },
  responses: {
    200: {
      description: "Schedule deleted successfully",
      content: {
        "application/json": {
          schema: deleteScheduleResponseSchema,
        },
      },
    },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse("Schedule or organization not found"),
  },
});

schedulesRoutes.openapi(getSchedulesRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const db = c.get("db") as DbClient;
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const { repositoryIds } = c.req.valid("query");
  const triggers = await db.query.contentTriggers.findMany({
    where: and(
      eq(contentTriggers.organizationId, orgId),
      eq(contentTriggers.sourceType, "cron")
    ),
    orderBy: [desc(contentTriggers.createdAt)],
  });

  const triggerIds = triggers.map((trigger) => trigger.id);
  const lookbackWindows =
    triggerIds.length > 0
      ? await db.query.contentTriggerLookbackWindows.findMany({
          where: inArray(contentTriggerLookbackWindows.triggerId, triggerIds),
        })
      : [];

  const lookbackWindowByTriggerId = new Map(
    lookbackWindows.map((item) => [item.triggerId, item.window])
  );
  const filteredTriggers = filterByRepositoryIds(triggers, repositoryIds);

  const schedules = filteredTriggers.map((trigger) =>
    serializeSchedule({
      ...trigger,
      lookbackWindow: (lookbackWindowByTriggerId.get(trigger.id) ??
        "last_7_days") as ScheduleLookbackWindow,
    })
  );

  const allRepositoryIds = [
    ...new Set(schedules.flatMap((schedule) => schedule.targets.repositoryIds)),
  ];
  const repositories =
    allRepositoryIds.length > 0
      ? await db
          .select({
            id: githubIntegrations.id,
            owner: githubIntegrations.owner,
            repo: githubIntegrations.repo,
            defaultBranch: githubIntegrations.defaultBranch,
          })
          .from(githubIntegrations)
          .where(inArray(githubIntegrations.id, allRepositoryIds))
      : [];

  const repositoryMap = Object.fromEntries(
    repositories
      .filter((repository) => repository.owner && repository.repo)
      .map((repository) => [
        repository.id,
        repository.defaultBranch?.trim()
          ? `${repository.owner}/${repository.repo} · ${repository.defaultBranch.trim()}`
          : `${repository.owner}/${repository.repo}`,
      ])
  );

  return c.json({ schedules, repositoryMap, organization }, 200);
});

schedulesRoutes.openapi(createScheduleRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const db = c.get("db") as DbClient;
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const input = c.req.valid("json");
  const env = (c.env ?? {}) as {
    QSTASH_TOKEN?: string;
    WORKFLOW_BASE_URL?: string;
  };
  const normalized = normalizeSchedule(input);
  const dedupeHash = hashSchedule(input);
  const existing = await db.query.contentTriggers.findFirst({
    where: and(
      eq(contentTriggers.organizationId, orgId),
      eq(contentTriggers.dedupeHash, dedupeHash)
    ),
  });

  if (existing) {
    return c.json({ error: "Duplicate schedule" }, 409);
  }

  if (input.enabled) {
    const missingTargets = await ensureScheduleTargetsExist(
      db,
      orgId,
      normalized.targets.repositoryIds,
      "Cannot create enabled schedule: one or more integrations not found"
    );

    if (missingTargets) {
      return c.json({ error: missingTargets.error }, 400);
    }
  }

  const triggerId = crypto.randomUUID();
  const persistedName = input.name.trim() || DEFAULT_SCHEDULE_NAME;
  const cronExpression = buildCronExpression(normalized.sourceConfig.cron);
  let qstashScheduleId: string | null = null;

  if (input.enabled) {
    try {
      qstashScheduleId = await createQstashSchedule(env, {
        triggerId,
        cron: cronExpression,
      });
    } catch (error) {
      const mapped = mapQstashError(error);
      if (mapped.status === 400) {
        return c.json({ error: mapped.error }, 400);
      }

      return c.json({ error: mapped.error }, 500);
    }
  }

  try {
    const schedule = await db.transaction(async (tx) => {
      const [createdTrigger] = await tx
        .insert(contentTriggers)
        .values({
          id: triggerId,
          organizationId: orgId,
          name: persistedName,
          sourceType: "cron",
          sourceConfig: normalized.sourceConfig,
          targets: normalized.targets,
          outputType: input.outputType,
          outputConfig: input.outputConfig ?? null,
          dedupeHash,
          enabled: input.enabled,
          autoPublish: input.autoPublish,
          qstashScheduleId,
        })
        .returning();

      if (!createdTrigger) {
        throw new Error("Failed to create schedule");
      }

      await tx.insert(contentTriggerLookbackWindows).values({
        triggerId,
        window: input.lookbackWindow,
      });

      return serializeSchedule({
        ...createdTrigger,
        lookbackWindow: input.lookbackWindow,
      });
    });

    return c.json({ schedule, organization }, 201);
  } catch (error) {
    if (qstashScheduleId) {
      await deleteQstashSchedule(env, qstashScheduleId).catch(() => null);
    }

    console.error("Failed to create schedule:", error);
    return c.json({ error: "Failed to create schedule" }, 500);
  }
});

schedulesRoutes.openapi(patchScheduleRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const db = c.get("db") as DbClient;
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const { scheduleId } = c.req.valid("param");
  const input = c.req.valid("json");
  const env = (c.env ?? {}) as {
    QSTASH_TOKEN?: string;
    WORKFLOW_BASE_URL?: string;
  };
  const normalized = normalizeSchedule(input);
  const dedupeHash = hashSchedule(input);
  const duplicate = await db.query.contentTriggers.findFirst({
    where: and(
      eq(contentTriggers.organizationId, orgId),
      eq(contentTriggers.dedupeHash, dedupeHash),
      ne(contentTriggers.id, scheduleId)
    ),
  });

  if (duplicate) {
    return c.json({ error: "Duplicate schedule" }, 409);
  }

  const existing = await db.query.contentTriggers.findFirst({
    where: and(
      eq(contentTriggers.id, scheduleId),
      eq(contentTriggers.organizationId, orgId),
      eq(contentTriggers.sourceType, "cron")
    ),
  });

  if (!existing) {
    return c.json({ error: "Schedule not found" }, 404);
  }

  if (input.enabled) {
    const missingTargets = await ensureScheduleTargetsExist(
      db,
      orgId,
      normalized.targets.repositoryIds,
      "Cannot enable schedule: one or more integrations have been deleted"
    );

    if (missingTargets) {
      return c.json({ error: missingTargets.error }, 400);
    }
  }

  const persistedName =
    input.name.trim() || existing.name || DEFAULT_SCHEDULE_NAME;
  const cronExpression = buildCronExpression(normalized.sourceConfig.cron);
  const previousQstashScheduleId = existing.qstashScheduleId ?? null;
  let qstashScheduleId: string | null = null;

  if (input.enabled) {
    try {
      qstashScheduleId = await createQstashSchedule(env, {
        triggerId: scheduleId,
        cron: cronExpression,
      });
    } catch (error) {
      const mapped = mapQstashError(error);
      if (mapped.status === 400) {
        return c.json({ error: mapped.error }, 400);
      }

      return c.json({ error: mapped.error }, 500);
    }
  }

  try {
    const schedule = await db.transaction(async (tx) => {
      const [updatedTrigger] = await tx
        .update(contentTriggers)
        .set({
          name: persistedName,
          sourceType: "cron",
          sourceConfig: normalized.sourceConfig,
          targets: normalized.targets,
          outputType: input.outputType,
          outputConfig: input.outputConfig ?? null,
          dedupeHash,
          enabled: input.enabled,
          autoPublish: input.autoPublish,
          qstashScheduleId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contentTriggers.id, scheduleId),
            eq(contentTriggers.organizationId, orgId)
          )
        )
        .returning();

      if (!updatedTrigger) {
        throw new Error("Failed to update schedule");
      }

      await tx
        .insert(contentTriggerLookbackWindows)
        .values({
          triggerId: scheduleId,
          window: input.lookbackWindow,
        })
        .onConflictDoUpdate({
          target: contentTriggerLookbackWindows.triggerId,
          set: {
            window: input.lookbackWindow,
            updatedAt: new Date(),
          },
        });

      return serializeSchedule({
        ...updatedTrigger,
        lookbackWindow: input.lookbackWindow,
      });
    });

    if (previousQstashScheduleId) {
      await deleteQstashSchedule(env, previousQstashScheduleId);
    }

    return c.json({ schedule, organization }, 200);
  } catch (error) {
    if (qstashScheduleId) {
      await deleteQstashSchedule(env, qstashScheduleId).catch(() => null);
    }

    console.error("Failed to update schedule:", error);
    return c.json({ error: "Failed to update schedule" }, 500);
  }
});

schedulesRoutes.openapi(deleteScheduleRoute, async (c) => {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }

  const db = c.get("db") as DbClient;
  const organization = await getOrganizationResponse(db, orgId);

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  const { scheduleId } = c.req.valid("param");
  const env = (c.env ?? {}) as {
    QSTASH_TOKEN?: string;
    WORKFLOW_BASE_URL?: string;
  };
  const existing = await db.query.contentTriggers.findFirst({
    where: and(
      eq(contentTriggers.id, scheduleId),
      eq(contentTriggers.organizationId, orgId),
      eq(contentTriggers.sourceType, "cron")
    ),
  });

  if (!existing) {
    return c.json({ error: "Schedule not found" }, 404);
  }

  if (existing.qstashScheduleId) {
    await deleteQstashSchedule(env, existing.qstashScheduleId);
  }

  await db
    .delete(contentTriggers)
    .where(
      and(
        eq(contentTriggers.id, scheduleId),
        eq(contentTriggers.organizationId, orgId)
      )
    );

  return c.json({ id: scheduleId, organization }, 200);
});
