import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations, mcpToolIndex } from "@notra/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type {
  McpStoreStatus,
  McpToolActionPhraseUpdate,
} from "../types/integrations";

export async function setMcpStoreStatus(params: {
  integrationId: string;
  status: McpStoreStatus;
  reviewNote?: string | null;
  expectedStatus?: McpStoreStatus;
}) {
  const now = new Date();
  const [row] = await db
    .update(mcpServerIntegrations)
    .set({
      storeStatus: params.status,
      reviewNote: params.reviewNote ?? null,
      ...(params.status === "pending_review"
        ? { submittedAt: now, reviewedAt: null }
        : {}),
      ...(params.status === "live" || params.status === "rejected"
        ? { reviewedAt: now }
        : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(mcpServerIntegrations.id, params.integrationId),
        ...(params.expectedStatus
          ? [eq(mcpServerIntegrations.storeStatus, params.expectedStatus)]
          : [])
      )
    )
    .returning();

  return row ?? null;
}

export async function listMcpIntegrationsPendingReview() {
  return await db.query.mcpServerIntegrations.findMany({
    where: eq(mcpServerIntegrations.storeStatus, "pending_review"),
    orderBy: asc(mcpServerIntegrations.submittedAt),
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getMcpIntegrationTools(params: {
  organizationId: string;
  integrationId: string;
}) {
  return await db.query.mcpToolIndex.findMany({
    where: and(
      eq(mcpToolIndex.organizationId, params.organizationId),
      eq(mcpToolIndex.serverIntegrationId, params.integrationId),
      eq(mcpToolIndex.status, "active")
    ),
    orderBy: asc(mcpToolIndex.serverToolName),
    columns: {
      id: true,
      serverToolName: true,
      title: true,
      description: true,
      actionPhrasePresent: true,
      actionPhrasePast: true,
    },
  });
}

export async function updateMcpToolActionPhrases(params: {
  organizationId: string;
  integrationId: string;
  updates: McpToolActionPhraseUpdate[];
}) {
  if (params.updates.length === 0) {
    return;
  }

  const toolNames = params.updates.map((update) => update.serverToolName);
  const existing = await db.query.mcpToolIndex.findMany({
    where: and(
      eq(mcpToolIndex.organizationId, params.organizationId),
      eq(mcpToolIndex.serverIntegrationId, params.integrationId),
      inArray(mcpToolIndex.serverToolName, toolNames)
    ),
    columns: { serverToolName: true },
  });
  const knownToolNames = new Set(existing.map((tool) => tool.serverToolName));
  const applicable = params.updates.filter((update) =>
    knownToolNames.has(update.serverToolName)
  );
  if (applicable.length === 0) {
    return;
  }

  const valueRows = sql.join(
    applicable.map(
      (update) =>
        sql`(${update.serverToolName}::text, ${update.actionPhrasePresent}::text, ${update.actionPhrasePast}::text)`
    ),
    sql`, `
  );

  await db.execute(sql`
    update ${mcpToolIndex} as tool
    set
      action_phrase_present = phrase.present,
      action_phrase_past = phrase.past,
      updated_at = now()
    from (values ${valueRows}) as phrase(tool_name, present, past)
    where tool.organization_id = ${params.organizationId}
      and tool.server_integration_id = ${params.integrationId}
      and tool.server_tool_name = phrase.tool_name
  `);
}
