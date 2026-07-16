import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations, mcpToolIndex } from "@notra/db/schema";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  McpStoreStatus,
  McpToolActionPhraseUpdate,
} from "../types/integrations";

export async function setMcpStoreStatus(params: {
  organizationId: string;
  integrationId: string;
  status: McpStoreStatus;
  reviewNote?: string | null;
  expectedStatus?: McpStoreStatus;
  expectedSubmittedAt?: Date | null;
}) {
  const now = new Date();
  return await db.transaction(async (tx) => {
    const [row] = await tx
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
        ...(params.status === "live" ? { enabled: true } : {}),
        updatedAt: now,
      })
      .where(
        and(
          eq(mcpServerIntegrations.id, params.integrationId),
          eq(mcpServerIntegrations.organizationId, params.organizationId),
          eq(mcpServerIntegrations.resourceType, "store_listing"),
          ...(params.expectedStatus
            ? [eq(mcpServerIntegrations.storeStatus, params.expectedStatus)]
            : []),
          ...(params.expectedSubmittedAt === undefined
            ? []
            : [
                params.expectedSubmittedAt === null
                  ? isNull(mcpServerIntegrations.submittedAt)
                  : eq(
                      mcpServerIntegrations.submittedAt,
                      params.expectedSubmittedAt
                    ),
              ])
        )
      )
      .returning();

    if (!row || params.status !== "live") {
      return row ?? null;
    }

    const [sourceTools, installedConnections] = await Promise.all([
      tx.query.mcpToolIndex.findMany({
        where: and(
          eq(mcpToolIndex.serverIntegrationId, params.integrationId),
          eq(mcpToolIndex.status, "active")
        ),
        columns: {
          serverToolName: true,
          actionPhrasePresent: true,
          actionPhrasePast: true,
        },
      }),
      tx.query.mcpServerIntegrations.findMany({
        where: and(
          eq(mcpServerIntegrations.resourceType, "connection"),
          eq(
            mcpServerIntegrations.storeSourceIntegrationId,
            params.integrationId
          )
        ),
        columns: { id: true },
      }),
    ]);

    const connectionIds = installedConnections.map(
      (connection) => connection.id
    );
    if (connectionIds.length > 0 && sourceTools.length > 0) {
      await Promise.all(
        sourceTools.map((tool) =>
          tx
            .update(mcpToolIndex)
            .set({
              actionPhrasePresent: tool.actionPhrasePresent,
              actionPhrasePast: tool.actionPhrasePast,
              updatedAt: now,
            })
            .where(
              and(
                inArray(mcpToolIndex.serverIntegrationId, connectionIds),
                eq(mcpToolIndex.serverToolName, tool.serverToolName),
                eq(mcpToolIndex.status, "active")
              )
            )
        )
      );
    }

    return row;
  });
}

export async function listMcpIntegrationsPendingReview() {
  return await db.query.mcpServerIntegrations.findMany({
    where: and(
      eq(mcpServerIntegrations.resourceType, "store_listing"),
      eq(mcpServerIntegrations.storeStatus, "pending_review")
    ),
    orderBy: asc(mcpServerIntegrations.submittedAt),
    limit: 100,
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

export async function listMcpIntegrationToolsByIntegrationIds(
  integrationIds: string[]
) {
  if (integrationIds.length === 0) {
    return [];
  }
  return await db.query.mcpToolIndex.findMany({
    where: and(
      inArray(mcpToolIndex.serverIntegrationId, integrationIds),
      eq(mcpToolIndex.status, "active")
    ),
    orderBy: asc(mcpToolIndex.serverToolName),
    columns: {
      id: true,
      serverIntegrationId: true,
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
    return 0;
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
  const updatesByToolName = new Map<string, McpToolActionPhraseUpdate>();
  for (const update of params.updates) {
    if (knownToolNames.has(update.serverToolName)) {
      updatesByToolName.set(update.serverToolName, update);
    }
  }
  const applicable = Array.from(updatesByToolName.values());
  if (applicable.length === 0) {
    return 0;
  }

  await db.transaction(async (tx) => {
    await Promise.all(
      applicable.map((update) =>
        tx
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
          )
      )
    );
  });

  return applicable.length;
}

export async function listLiveMcpStoreIntegrations() {
  return await db.query.mcpServerIntegrations.findMany({
    where: and(
      eq(mcpServerIntegrations.resourceType, "store_listing"),
      eq(mcpServerIntegrations.storeStatus, "live"),
      eq(mcpServerIntegrations.enabled, true)
    ),
    orderBy: asc(mcpServerIntegrations.name),
    columns: {
      id: true,
      name: true,
      url: true,
      description: true,
      author: true,
      websiteUrl: true,
      brandColor: true,
      logoLightUrl: true,
      logoDarkUrl: true,
      authType: true,
      indexedToolCount: true,
    },
  });
}

export async function getLiveMcpStoreIntegrationById(integrationId: string) {
  const integration = await db.query.mcpServerIntegrations.findFirst({
    where: and(
      eq(mcpServerIntegrations.id, integrationId),
      eq(mcpServerIntegrations.resourceType, "store_listing"),
      eq(mcpServerIntegrations.storeStatus, "live"),
      eq(mcpServerIntegrations.enabled, true)
    ),
    columns: {
      id: true,
      name: true,
      url: true,
      description: true,
      author: true,
      websiteUrl: true,
      brandColor: true,
      logoLightUrl: true,
      logoDarkUrl: true,
      bannerUrl: true,
      authType: true,
      indexedToolCount: true,
    },
  });

  return integration ?? null;
}
