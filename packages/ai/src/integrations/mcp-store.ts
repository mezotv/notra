import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations, mcpToolIndex } from "@notra/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  McpStoreStatus,
  McpToolActionPhraseUpdate,
} from "../types/integrations";

export async function setMcpStoreStatus(params: {
  integrationId: string;
  status: McpStoreStatus;
  reviewNote?: string | null;
}) {
  const now = new Date();
  const [row] = await db
    .update(mcpServerIntegrations)
    .set({
      storeStatus: params.status,
      reviewNote: params.reviewNote ?? null,
      ...(params.status === "pending_review" ? { submittedAt: now } : {}),
      ...(params.status === "live" || params.status === "rejected"
        ? { reviewedAt: now }
        : {}),
      updatedAt: now,
    })
    .where(eq(mcpServerIntegrations.id, params.integrationId))
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

  await db.transaction(async (tx) => {
    for (const update of params.updates) {
      if (!knownToolNames.has(update.serverToolName)) {
        continue;
      }
      await tx
        .update(mcpToolIndex)
        .set({
          actionPhrasePresent: update.actionPhrasePresent,
          actionPhrasePast: update.actionPhrasePast,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mcpToolIndex.organizationId, params.organizationId),
            eq(mcpToolIndex.serverIntegrationId, params.integrationId),
            eq(mcpToolIndex.serverToolName, update.serverToolName)
          )
        );
    }
  });
}
