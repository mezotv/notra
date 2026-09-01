import { classifyAgentFeedback } from "@notra/ai/jobs/feedback-classifier";
import { agentFeedback, organizations, projects } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { nanoid } from "nanoid";

import { isIngestAuth } from "../types/auth";
import type {
  AgentFeedbackRow,
  SerializedAgentFeedback,
  SubmitFeedbackBody,
  SubmitFeedbackOutcome,
} from "../types/feedback";

const PUBLIC_FEEDBACK_INGEST_PATH_REGEX = /^\/v1\/feedback\/[^/]+\/?$/;

export function serializeFeedback(
  row: AgentFeedbackRow
): SerializedAgentFeedback {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

function getIngestProjectId(c: Context): string | null | undefined {
  const auth = c.get("auth");
  return auth && isIngestAuth(auth) ? auth.projectId : undefined;
}

export function isPublicFeedbackIngestRequest(
  pathname: string,
  method: string
): boolean {
  return method === "POST" && PUBLIC_FEEDBACK_INGEST_PATH_REGEX.test(pathname);
}

export async function findOrganizationIdBySlug(
  c: Context,
  slug: string
): Promise<string | null> {
  const organization = await c.get("db").query.organizations.findFirst({
    columns: { id: true },
    where: eq(organizations.slug, slug.toLowerCase()),
  });
  return organization?.id ?? null;
}

async function projectExists(
  c: Context,
  organizationId: string,
  projectId: string
): Promise<boolean> {
  const project = await c.get("db").query.projects.findFirst({
    columns: { id: true },
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId)
    ),
  });
  return project !== undefined;
}

export async function submitFeedback(
  c: Context,
  organizationId: string,
  body: SubmitFeedbackBody
): Promise<SubmitFeedbackOutcome> {
  const tokenProjectId = getIngestProjectId(c);
  const projectId =
    tokenProjectId === undefined ? (body.projectId ?? null) : tokenProjectId;

  if (
    tokenProjectId === undefined &&
    projectId &&
    !(await projectExists(c, organizationId, projectId))
  ) {
    return { kind: "project_not_found" };
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
    return {
      kind: "accepted",
      feedback: serializeFeedback(created),
      deduplicated: false,
    };
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
    return { kind: "not_found" };
  }

  return {
    kind: "accepted",
    feedback: serializeFeedback(existing),
    deduplicated: true,
  };
}
