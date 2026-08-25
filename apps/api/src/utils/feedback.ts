import { projects } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { isIngestAuth } from "../types/auth";
import type {
  AgentFeedbackRow,
  SerializedAgentFeedback,
} from "../types/feedback";

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

export function getIngestProjectId(c: Context): string | null | undefined {
  const auth = c.get("auth");
  return isIngestAuth(auth) ? auth.projectId : undefined;
}

export async function projectExists(
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
