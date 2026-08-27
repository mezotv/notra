import { createRoute } from "@hono/zod-openapi";
import { classifyAgentFeedback } from "@notra/ai/jobs/feedback-classifier";
import { agentFeedback } from "@notra/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  FEEDBACK_NOT_FOUND_ERROR,
  FEEDBACK_PROJECT_NOT_FOUND_ERROR,
} from "../constants/feedback";
import { ORGANIZATION_SCOPED_API_KEY_ERROR } from "../constants/skills";
import {
  feedbackParamsSchema,
  feedbackResponseSchema,
  listFeedbackQuerySchema,
  listFeedbackResponseSchema,
  submitFeedbackRequestSchema,
  submitFeedbackResponseSchema,
  updateFeedbackRequestSchema,
} from "../schemas/feedback";
import { getOrganizationId } from "../utils/auth";
import {
  getIngestProjectId,
  projectExists,
  serializeFeedback,
} from "../utils/feedback";
import { createOpenApiApp } from "../utils/openapi-app";
import { errorResponse, rateLimitResponse } from "../utils/openapi-responses";
import { enforceRatelimit, RATE_LIMITS, ratelimit } from "../utils/ratelimit";

export const feedbackRoutes = createOpenApiApp();

const submitFeedbackRoute = createRoute({
  method: "post",
  path: "/feedback",
  tags: ["Feedback"],
  operationId: "submitFeedback",
  summary: "Submit feedback",
  description:
    "Record feedback from an AI agent or integration. Accepts a write-only feedback token (Authorization: Bearer nfb_...) or an API key with the feedback.write scope.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: submitFeedbackRequestSchema },
      },
    },
  },
  responses: {
    202: {
      description: "Feedback accepted",
      content: {
        "application/json": { schema: submitFeedbackResponseSchema },
      },
    },
    400: errorResponse("Invalid request body"),
    401: errorResponse("Missing or invalid credentials"),
    403: errorResponse("Forbidden"),
    404: errorResponse(FEEDBACK_PROJECT_NOT_FOUND_ERROR),
    429: rateLimitResponse(
      RATE_LIMITS.feedbackIngest.requests,
      RATE_LIMITS.feedbackIngest.window
    ),
    503: errorResponse("Authentication service unavailable"),
  },
});

const listFeedbackRoute = createRoute({
  method: "get",
  path: "/feedback",
  tags: ["Feedback"],
  operationId: "listFeedback",
  summary: "List feedback",
  request: { query: listFeedbackQuerySchema },
  responses: {
    200: {
      description: "Feedback fetched successfully",
      content: { "application/json": { schema: listFeedbackResponseSchema } },
    },
    400: errorResponse("Invalid query params"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    503: errorResponse("Authentication service unavailable"),
  },
});

const getFeedbackRoute = createRoute({
  method: "get",
  path: "/feedback/{feedbackId}",
  tags: ["Feedback"],
  operationId: "getFeedback",
  summary: "Get a single feedback entry",
  request: { params: feedbackParamsSchema },
  responses: {
    200: {
      description: "Feedback fetched successfully",
      content: { "application/json": { schema: feedbackResponseSchema } },
    },
    400: errorResponse("Invalid path params"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse(FEEDBACK_NOT_FOUND_ERROR),
    503: errorResponse("Authentication service unavailable"),
  },
});

const updateFeedbackRoute = createRoute({
  method: "patch",
  path: "/feedback/{feedbackId}",
  tags: ["Feedback"],
  operationId: "updateFeedback",
  summary: "Update feedback status",
  request: {
    params: feedbackParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": { schema: updateFeedbackRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Feedback updated successfully",
      content: { "application/json": { schema: feedbackResponseSchema } },
    },
    400: errorResponse("Invalid path params or request body"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Forbidden"),
    404: errorResponse(FEEDBACK_NOT_FOUND_ERROR),
    503: errorResponse("Authentication service unavailable"),
  },
});

feedbackRoutes.openapi(submitFeedbackRoute, async (c) => {
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const ipLimited = await enforceRatelimit(c, ratelimit.feedbackIngestIp, "ip");
  if (ipLimited) {
    return ipLimited;
  }

  const rateLimited = await enforceRatelimit(c, ratelimit.feedbackIngest);
  if (rateLimited) {
    return rateLimited;
  }

  const body = c.req.valid("json");
  const tokenProjectId = getIngestProjectId(c);
  const projectId =
    tokenProjectId === undefined ? (body.projectId ?? null) : tokenProjectId;

  if (
    tokenProjectId === undefined &&
    projectId &&
    !(await projectExists(c, organizationId, projectId))
  ) {
    return c.json({ error: FEEDBACK_PROJECT_NOT_FOUND_ERROR }, 404);
  }

  const feedbackId = nanoid();
  const needsClassification = !(body.kind && body.sentiment && body.title);
  const classification = needsClassification
    ? await classifyAgentFeedback({
        organizationId,
        feedbackId,
        message: body.message,
        title: body.title,
        contextUrl: body.contextUrl,
        agentClient: body.agentClient,
      })
    : null;

  const db = c.get("db");
  const [created] = await db
    .insert(agentFeedback)
    .values({
      id: feedbackId,
      organizationId,
      projectId,
      source: body.source,
      kind: body.kind ?? classification?.kind ?? "other",
      sentiment: body.sentiment ?? classification?.sentiment ?? null,
      title: body.title ?? classification?.title ?? null,
      message: body.message,
      agentClient: body.agentClient ?? null,
      agentModel: body.agentModel ?? null,
      toolVersion: body.toolVersion ?? null,
      userAgent: body.userAgent ?? c.req.header("user-agent") ?? null,
      contextUrl: body.contextUrl ?? null,
      externalId: body.externalId ?? null,
      idempotencyKey: body.idempotencyKey ?? null,
      metadata: body.metadata ?? null,
    })
    .onConflictDoNothing({
      target: [agentFeedback.organizationId, agentFeedback.idempotencyKey],
    })
    .returning();

  if (created) {
    return c.json(
      { feedback: serializeFeedback(created), deduplicated: false },
      202
    );
  }

  const existing = body.idempotencyKey
    ? await db.query.agentFeedback.findFirst({
        where: and(
          eq(agentFeedback.organizationId, organizationId),
          eq(agentFeedback.idempotencyKey, body.idempotencyKey)
        ),
      })
    : undefined;

  if (!existing) {
    return c.json({ error: FEEDBACK_NOT_FOUND_ERROR }, 404);
  }

  return c.json(
    { feedback: serializeFeedback(existing), deduplicated: true },
    202
  );
});

feedbackRoutes.openapi(listFeedbackRoute, async (c) => {
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const query = c.req.valid("query");
  const conditions = [eq(agentFeedback.organizationId, organizationId)];
  if (query.status) {
    conditions.push(eq(agentFeedback.status, query.status));
  }
  if (query.kind) {
    conditions.push(eq(agentFeedback.kind, query.kind));
  }
  if (query.projectId) {
    conditions.push(eq(agentFeedback.projectId, query.projectId));
  }
  const where = and(...conditions);

  const db = c.get("db");
  const [[totals], rows] = await Promise.all([
    db.select({ total: count() }).from(agentFeedback).where(where),
    db
      .select()
      .from(agentFeedback)
      .where(where)
      .orderBy(desc(agentFeedback.createdAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
  ]);

  const totalItems = totals?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));

  return c.json(
    {
      feedback: rows.map(serializeFeedback),
      pagination: {
        limit: query.limit,
        currentPage: query.page,
        nextPage: query.page < totalPages ? query.page + 1 : null,
        previousPage: query.page > 1 ? query.page - 1 : null,
        totalPages,
        totalItems,
      },
    },
    200
  );
});

feedbackRoutes.openapi(getFeedbackRoute, async (c) => {
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const { feedbackId } = c.req.valid("param");
  const row = await c.get("db").query.agentFeedback.findFirst({
    where: and(
      eq(agentFeedback.organizationId, organizationId),
      eq(agentFeedback.id, feedbackId)
    ),
  });

  if (!row) {
    return c.json({ error: FEEDBACK_NOT_FOUND_ERROR }, 404);
  }

  return c.json({ feedback: serializeFeedback(row) }, 200);
});

feedbackRoutes.openapi(updateFeedbackRoute, async (c) => {
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return c.json({ error: ORGANIZATION_SCOPED_API_KEY_ERROR }, 403);
  }

  const { feedbackId } = c.req.valid("param");
  const body = c.req.valid("json");

  const [updated] = await c
    .get("db")
    .update(agentFeedback)
    .set({
      status: body.status,
      resolvedAt: body.status === "resolved" ? new Date() : null,
    })
    .where(
      and(
        eq(agentFeedback.organizationId, organizationId),
        eq(agentFeedback.id, feedbackId)
      )
    )
    .returning();

  if (!updated) {
    return c.json({ error: FEEDBACK_NOT_FOUND_ERROR }, 404);
  }

  return c.json({ feedback: serializeFeedback(updated) }, 200);
});
