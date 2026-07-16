import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations, mcpToolIndex } from "@notra/db/schema";
import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNull,
  notInArray,
  sql,
} from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type {
  McpStoreStatus,
  McpToolActionPhraseUpdate,
} from "../types/integrations";
import { createMcpToolFingerprint } from "../utils/mcp-tool-fingerprint";
import { createMcpRuntimeToolName } from "./mcp-tool-name";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
const MANUAL_TOOL_META = { notraManual: true };

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
      const valueRows = sql.join(
        sourceTools.map(
          (tool) =>
            sql`(${tool.serverToolName}::text, ${tool.actionPhrasePresent}::text, ${tool.actionPhrasePast}::text)`
        ),
        sql`, `
      );
      const connectionIdValues = sql.join(
        connectionIds.map((connectionId) => sql`${connectionId}::text`),
        sql`, `
      );
      await tx.execute(sql`
        update ${mcpToolIndex} as tool
        set
          action_phrase_present = phrase.present,
          action_phrase_past = phrase.past,
          updated_at = ${now}
        from (values ${valueRows}) as phrase(tool_name, present, past)
        where tool.server_integration_id in (${connectionIdValues})
          and tool.server_tool_name = phrase.tool_name
          and tool.status = 'active'
      `);
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
  const tools = await db.query.mcpToolIndex.findMany({
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
      meta: true,
    },
  });
  return tools.map(({ meta, ...tool }) => ({
    ...tool,
    ...(isManualToolMeta(meta) ? { isManual: true } : {}),
  }));
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
  manualToolNames?: string[];
  updates: McpToolActionPhraseUpdate[];
}) {
  if (params.updates.length === 0 && params.manualToolNames === undefined) {
    return 0;
  }

  const integration = await db.query.mcpServerIntegrations.findFirst({
    where: and(
      eq(mcpServerIntegrations.organizationId, params.organizationId),
      eq(mcpServerIntegrations.id, params.integrationId),
      eq(mcpServerIntegrations.resourceType, "store_listing")
    ),
    columns: { description: true, id: true, name: true },
  });
  if (!integration) {
    return 0;
  }

  const updatesByToolName = new Map<string, McpToolActionPhraseUpdate>();
  for (const update of params.updates) {
    updatesByToolName.set(update.serverToolName, update);
  }
  const applicable = Array.from(updatesByToolName.values());
  const manualToolNames = params.manualToolNames
    ? Array.from(new Set(params.manualToolNames))
    : undefined;
  const now = new Date();

  const removedCount = await db.transaction(async (tx) => {
    if (applicable.length > 0) {
      await tx
        .insert(mcpToolIndex)
        .values(
          applicable.map((update) => {
            const inputSchema = {
              additionalProperties: true,
              properties: {},
              type: "object",
            };
            const runtimeToolName = createMcpRuntimeToolName({
              integrationId: integration.id,
              serverName: integration.name,
              serverToolName: update.serverToolName,
              withHash: true,
            });
            return {
              actionPhrasePast: update.actionPhrasePast,
              actionPhrasePresent: update.actionPhrasePresent,
              id: `mcpt_${nanoid()}`,
              inputSchema,
              lastIndexedAt: now,
              meta: MANUAL_TOOL_META,
              organizationId: params.organizationId,
              runtimeToolName,
              schemaHash: createMcpToolFingerprint({
                inputSchema,
                name: update.serverToolName,
              }),
              searchText: [
                integration.name,
                integration.description,
                update.serverToolName,
                runtimeToolName,
              ]
                .filter(Boolean)
                .join(" "),
              serverIntegrationId: params.integrationId,
              serverToolName: update.serverToolName,
              status: "active",
              updatedAt: now,
            };
          })
        )
        .onConflictDoUpdate({
          target: [
            mcpToolIndex.serverIntegrationId,
            mcpToolIndex.serverToolName,
          ],
          set: {
            actionPhrasePast: sql`excluded.action_phrase_past`,
            actionPhrasePresent: sql`excluded.action_phrase_present`,
            errorMessage: null,
            status: "active",
            updatedAt: now,
          },
        });
    }

    let removedManualTools: { id: string }[] = [];
    if (manualToolNames !== undefined) {
      removedManualTools = await tx
        .delete(mcpToolIndex)
        .where(
          and(
            eq(mcpToolIndex.organizationId, params.organizationId),
            eq(mcpToolIndex.serverIntegrationId, params.integrationId),
            sql`${mcpToolIndex.meta} ->> 'notraManual' = 'true'`,
            ...(manualToolNames.length > 0
              ? [notInArray(mcpToolIndex.serverToolName, manualToolNames)]
              : [])
          )
        )
        .returning({ id: mcpToolIndex.id });
    }

    const [toolCount] = await tx
      .select({ value: count() })
      .from(mcpToolIndex)
      .where(
        and(
          eq(mcpToolIndex.organizationId, params.organizationId),
          eq(mcpToolIndex.serverIntegrationId, params.integrationId),
          eq(mcpToolIndex.status, "active")
        )
      );
    await tx
      .update(mcpServerIntegrations)
      .set({ indexedToolCount: toolCount?.value ?? 0, updatedAt: now })
      .where(eq(mcpServerIntegrations.id, params.integrationId));

    return removedManualTools.length;
  });

  return applicable.length + removedCount;
}

function isManualToolMeta(meta: unknown) {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "notraManual" in meta &&
    meta.notraManual === true
  );
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
