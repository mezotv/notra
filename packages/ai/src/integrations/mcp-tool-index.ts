import { createHash } from "node:crypto";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { db } from "@notra/db/drizzle";
import {
  mcpServerIntegrations,
  mcpSessionToolActivations,
  mcpToolIndex,
} from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import {
  and,
  count,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { decryptToken } from "../crypto/token-encryption";
import { createMcpRuntimeToolName } from "./mcp-tool-name";

export const MCP_SESSION_ACTIVE_TOOL_LIMIT = 20;
export const MCP_ACTIVATE_BATCH_LIMIT = 5;
export const MCP_SEARCH_LIMIT_DEFAULT = 8;
export const MCP_SEARCH_LIMIT_MAX = 15;
export const MCP_INDEX_TIMEOUT_MS = 15_000;
export const MCP_EXECUTION_TIMEOUT_MS = 30_000;
export const MCP_MAX_RUNTIME_WRAPPERS = 2000;

export type McpToolIndexStatus = "active" | "stale" | "unavailable" | "error";
export type McpToolSyncStatus = "idle" | "syncing" | "synced" | "error";
export type McpSessionSurface = "standalone-chat" | "editor-chat";

type McpListToolsResult = Awaited<ReturnType<MCPClient["listTools"]>>;
export type McpToolDefinition = McpListToolsResult["tools"][number];

export interface IndexedMcpTool {
  id: string;
  organizationId: string;
  serverIntegrationId: string;
  serverToolName: string;
  runtimeToolName: string;
  title: string | null;
  description: string | null;
  inputSchema: unknown;
  outputSchema: unknown;
  annotations: unknown;
  meta: unknown;
  schemaHash: string;
  searchText: string;
  status: string;
  serverName: string;
  serverUrl: string;
  serverEnabled: boolean;
}

export interface ActivatedMcpTool extends IndexedMcpTool {
  activationId: string;
  sourceQuery: string | null;
  activatedAt: Date;
  lastUsedAt: Date | null;
}

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
export async function refreshMcpToolIndexForOrganization({
  organizationId,
}: {
  organizationId: string;
}) {
  const integrations = await db.query.mcpServerIntegrations.findMany({
    where: and(
      eq(mcpServerIntegrations.organizationId, organizationId),
      eq(mcpServerIntegrations.enabled, true)
    ),
    columns: {
      id: true,
    },
  });

  const results: Array<{ integrationId: string; indexedToolCount: number }> =
    [];
  for (const integration of integrations) {
    try {
      results.push(
        await refreshMcpToolIndexForIntegration({
          organizationId,
          integrationId: integration.id,
        })
      );
    } catch (error) {
      console.error("[MCP Tool Index Organization Refresh Error]", {
        organizationId,
        integrationId: integration.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

export async function refreshMcpToolIndexForIntegration({
  organizationId,
  integrationId,
}: {
  organizationId: string;
  integrationId: string;
}) {
  const integration = await db.query.mcpServerIntegrations.findFirst({
    where: and(
      eq(mcpServerIntegrations.id, integrationId),
      eq(mcpServerIntegrations.organizationId, organizationId)
    ),
  });

  if (!integration) {
    throw new Error("MCP server integration not found.");
  }

  if (!integration.enabled) {
    await db
      .update(mcpServerIntegrations)
      .set({
        toolSyncStatus: "idle",
        indexedToolCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(mcpServerIntegrations.id, integrationId));
    return { integrationId, indexedToolCount: 0 };
  }

  await db
    .update(mcpServerIntegrations)
    .set({
      toolSyncStatus: "syncing",
      toolSyncError: null,
      updatedAt: new Date(),
    })
    .where(eq(mcpServerIntegrations.id, integrationId));

  let client: MCPClient | null = null;
  const seenToolNames: string[] = [];

  try {
    await assertPublicHttpUrlResolution(integration.url);

    client = await createMCPClient({
      clientName: "notra",
      version: "0.0.1",
      transport: {
        type: "http",
        url: integration.url,
        headers: decryptHeaders(integration.encryptedHeaders),
        redirect: "error",
      },
      onUncaughtError: (error) => {
        console.error("[MCP Index Client Error]", {
          integrationId,
          organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    });

    let cursor: string | undefined;
    do {
      const definitions = await client.listTools({
        params: cursor ? { cursor } : undefined,
        options: {
          signal: AbortSignal.timeout(MCP_INDEX_TIMEOUT_MS),
        },
      });

      for (const definition of definitions.tools) {
        seenToolNames.push(definition.name);
        await upsertIndexedTool({
          organizationId,
          integration: {
            id: integration.id,
            name: integration.name,
            description: integration.description,
          },
          definition,
        });
      }

      cursor = definitions.nextCursor;
    } while (cursor);

    if (seenToolNames.length > 0) {
      await db
        .update(mcpToolIndex)
        .set({
          status: "stale",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mcpToolIndex.serverIntegrationId, integrationId),
            notInArray(mcpToolIndex.serverToolName, seenToolNames)
          )
        );
    } else {
      await db
        .update(mcpToolIndex)
        .set({
          status: "stale",
          updatedAt: new Date(),
        })
        .where(eq(mcpToolIndex.serverIntegrationId, integrationId));
    }

    await db
      .update(mcpServerIntegrations)
      .set({
        lastToolSyncAt: new Date(),
        toolSyncStatus: "synced",
        toolSyncError: null,
        indexedToolCount: seenToolNames.length,
        updatedAt: new Date(),
      })
      .where(eq(mcpServerIntegrations.id, integrationId));

    return { integrationId, indexedToolCount: seenToolNames.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(mcpServerIntegrations)
      .set({
        lastToolSyncAt: new Date(),
        toolSyncStatus: "error",
        toolSyncError: sanitizeErrorMessage(message),
        updatedAt: new Date(),
      })
      .where(eq(mcpServerIntegrations.id, integrationId));

    console.error("[MCP Tool Index Refresh Error]", {
      integrationId,
      organizationId,
      error: message,
    });
    throw error;
  } finally {
    await client?.close().catch(() => undefined);
  }
}

export async function searchMcpToolIndex({
  organizationId,
  query,
  serverIntegrationId,
  limit = MCP_SEARCH_LIMIT_DEFAULT,
}: {
  organizationId: string;
  query: string;
  serverIntegrationId?: string;
  limit?: number;
}) {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();
  const boundedLimit = Math.min(Math.max(limit, 1), MCP_SEARCH_LIMIT_MAX);

  const activeCount = await db
    .select({ value: count() })
    .from(mcpToolIndex)
    .where(
      and(
        eq(mcpToolIndex.organizationId, organizationId),
        eq(mcpToolIndex.status, "active")
      )
    )
    .then((rows) => Number(rows[0]?.value ?? 0));

  if (activeCount === 0) {
    await refreshMcpToolIndexForOrganization({ organizationId }).catch(
      (error) => {
        console.error("[MCP Tool Index Refresh During Search Error]", {
          organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    );
  }

  const where = and(
    eq(mcpToolIndex.organizationId, organizationId),
    eq(mcpToolIndex.status, "active"),
    eq(mcpServerIntegrations.enabled, true),
    serverIntegrationId
      ? eq(mcpToolIndex.serverIntegrationId, serverIntegrationId)
      : undefined,
    normalizedQuery
      ? or(
          sql`to_tsvector('english', ${mcpToolIndex.searchText}) @@ plainto_tsquery('english', ${normalizedQuery})`,
          ilike(mcpToolIndex.searchText, `%${normalizedQuery}%`),
          ilike(mcpToolIndex.runtimeToolName, `%${normalizedQuery}%`),
          ilike(mcpServerIntegrations.name, `%${normalizedQuery}%`)
        )
      : undefined
  );

  return db
    .select({
      tool: mcpToolIndex,
      serverName: mcpServerIntegrations.name,
      serverUrl: mcpServerIntegrations.url,
      serverEnabled: mcpServerIntegrations.enabled,
      rank: normalizedQuery
        ? sql<number>`ts_rank_cd(to_tsvector('english', ${mcpToolIndex.searchText}), plainto_tsquery('english', ${normalizedQuery}))`
        : sql<number>`0`,
    })
    .from(mcpToolIndex)
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpToolIndex.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(where)
    .orderBy(
      normalizedQuery
        ? sql`ts_rank_cd(to_tsvector('english', ${mcpToolIndex.searchText}), plainto_tsquery('english', ${normalizedQuery})) desc`
        : sql`${mcpToolIndex.runtimeToolName} asc`,
      mcpToolIndex.runtimeToolName
    )
    .limit(boundedLimit)
    .then((rows) =>
      rows.map((row) =>
        toIndexedMcpTool(row.tool, {
          serverName: row.serverName,
          serverUrl: row.serverUrl,
          serverEnabled: row.serverEnabled,
        })
      )
    );
}

export async function getIndexedMcpToolsForRuntime({
  organizationId,
  limit = MCP_MAX_RUNTIME_WRAPPERS,
}: {
  organizationId: string;
  limit?: number;
}) {
  return db
    .select({
      tool: mcpToolIndex,
      serverName: mcpServerIntegrations.name,
      serverUrl: mcpServerIntegrations.url,
      serverEnabled: mcpServerIntegrations.enabled,
    })
    .from(mcpToolIndex)
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpToolIndex.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(
      and(
        eq(mcpToolIndex.organizationId, organizationId),
        eq(mcpToolIndex.status, "active"),
        eq(mcpServerIntegrations.enabled, true)
      )
    )
    .orderBy(mcpToolIndex.runtimeToolName)
    .limit(limit)
    .then((rows) =>
      rows.map((row) =>
        toIndexedMcpTool(row.tool, {
          serverName: row.serverName,
          serverUrl: row.serverUrl,
          serverEnabled: row.serverEnabled,
        })
      )
    );
}

export async function hasActiveIndexedMcpToolsForOrganization({
  organizationId,
}: {
  organizationId: string;
}) {
  const [row] = await db
    .select({ value: count() })
    .from(mcpToolIndex)
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpToolIndex.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(
      and(
        eq(mcpToolIndex.organizationId, organizationId),
        eq(mcpToolIndex.status, "active"),
        eq(mcpServerIntegrations.enabled, true)
      )
    )
    .limit(1);

  return (row?.value ?? 0) > 0;
}

export async function getSessionActivatedMcpTools({
  organizationId,
  sessionId,
  surface,
}: {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
}) {
  const now = new Date();
  return db
    .select({
      activation: mcpSessionToolActivations,
      tool: mcpToolIndex,
      serverName: mcpServerIntegrations.name,
      serverUrl: mcpServerIntegrations.url,
      serverEnabled: mcpServerIntegrations.enabled,
    })
    .from(mcpSessionToolActivations)
    .innerJoin(
      mcpToolIndex,
      eq(mcpSessionToolActivations.mcpToolIndexId, mcpToolIndex.id)
    )
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpToolIndex.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(
      and(
        eq(mcpSessionToolActivations.organizationId, organizationId),
        eq(mcpSessionToolActivations.sessionId, sessionId),
        eq(mcpSessionToolActivations.surface, surface),
        eq(mcpToolIndex.organizationId, organizationId),
        eq(mcpToolIndex.status, "active"),
        eq(mcpServerIntegrations.enabled, true),
        or(
          isNull(mcpSessionToolActivations.expiresAt),
          gt(mcpSessionToolActivations.expiresAt, now)
        )
      )
    )
    .orderBy(mcpSessionToolActivations.activatedAt)
    .then((rows) =>
      rows.map((row) => ({
        ...toIndexedMcpTool(row.tool, {
          serverName: row.serverName,
          serverUrl: row.serverUrl,
          serverEnabled: row.serverEnabled,
        }),
        activationId: row.activation.id,
        sourceQuery: row.activation.sourceQuery,
        activatedAt: row.activation.activatedAt,
        lastUsedAt: row.activation.lastUsedAt,
      }))
    );
}

export async function activateSessionMcpTools({
  organizationId,
  sessionId,
  surface,
  toolIds,
  sourceQuery,
}: {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
  toolIds: string[];
  sourceQuery?: string;
}) {
  const uniqueToolIds = Array.from(new Set(toolIds));
  if (uniqueToolIds.length === 0) {
    return [];
  }
  if (uniqueToolIds.length > MCP_ACTIVATE_BATCH_LIMIT) {
    throw new Error(
      `Activate at most ${MCP_ACTIVATE_BATCH_LIMIT} MCP tools at a time.`
    );
  }

  let tools = await getToolsByIds(organizationId, uniqueToolIds);
  const staleIntegrationIds = new Set(
    tools
      .filter((tool) => tool.status === "stale")
      .map((tool) => tool.serverIntegrationId)
  );
  for (const integrationId of staleIntegrationIds) {
    await refreshMcpToolIndexForIntegration({
      organizationId,
      integrationId,
    }).catch((error) => {
      console.error("[MCP Tool Index Stale Refresh Error]", {
        organizationId,
        integrationId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
  if (staleIntegrationIds.size > 0) {
    tools = await getToolsByIds(organizationId, uniqueToolIds);
  }

  const activeTools = tools.filter(
    (tool) => tool.status === "active" && tool.serverEnabled
  );
  if (activeTools.length !== uniqueToolIds.length) {
    throw new Error("One or more MCP tools are unavailable.");
  }

  const existing = await getSessionActivatedMcpTools({
    organizationId,
    sessionId,
    surface,
  });
  const existingIds = new Set(existing.map((tool) => tool.id));
  const newCount = activeTools.filter(
    (tool) => !existingIds.has(tool.id)
  ).length;
  if (existing.length + newCount > MCP_SESSION_ACTIVE_TOOL_LIMIT) {
    throw new Error(
      `This session can activate at most ${MCP_SESSION_ACTIVE_TOOL_LIMIT} MCP tools. Deactivate unused tools first.`
    );
  }

  for (const tool of activeTools) {
    await db
      .insert(mcpSessionToolActivations)
      .values({
        id: `mcpa_${nanoid()}`,
        organizationId,
        sessionId,
        surface,
        mcpToolIndexId: tool.id,
        runtimeToolName: tool.runtimeToolName,
        sourceQuery: sourceQuery ?? null,
      })
      .onConflictDoUpdate({
        target: [
          mcpSessionToolActivations.organizationId,
          mcpSessionToolActivations.sessionId,
          mcpSessionToolActivations.surface,
          mcpSessionToolActivations.mcpToolIndexId,
        ],
        set: {
          runtimeToolName: tool.runtimeToolName,
          sourceQuery: sourceQuery ?? null,
        },
      });
  }

  return getSessionActivatedMcpTools({ organizationId, sessionId, surface });
}

export async function deactivateSessionMcpTools({
  organizationId,
  sessionId,
  surface,
  toolIds,
  runtimeToolNames,
}: {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
  toolIds?: string[];
  runtimeToolNames?: string[];
}) {
  const conditions = [
    eq(mcpSessionToolActivations.organizationId, organizationId),
    eq(mcpSessionToolActivations.sessionId, sessionId),
    eq(mcpSessionToolActivations.surface, surface),
  ];

  if (toolIds?.length) {
    conditions.push(inArray(mcpSessionToolActivations.mcpToolIndexId, toolIds));
  } else if (runtimeToolNames?.length) {
    conditions.push(
      inArray(mcpSessionToolActivations.runtimeToolName, runtimeToolNames)
    );
  } else {
    return { deactivated: 0 };
  }

  const deleted = await db
    .delete(mcpSessionToolActivations)
    .where(and(...conditions))
    .returning({ id: mcpSessionToolActivations.id });

  return { deactivated: deleted.length };
}

export async function getIndexedMcpToolByRuntimeName({
  organizationId,
  runtimeToolName,
}: {
  organizationId: string;
  runtimeToolName: string;
}) {
  const [row] = await db
    .select({
      tool: mcpToolIndex,
      serverName: mcpServerIntegrations.name,
      serverUrl: mcpServerIntegrations.url,
      serverEnabled: mcpServerIntegrations.enabled,
    })
    .from(mcpToolIndex)
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpToolIndex.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(
      and(
        eq(mcpToolIndex.organizationId, organizationId),
        eq(mcpToolIndex.runtimeToolName, runtimeToolName)
      )
    )
    .limit(1);

  return row
    ? toIndexedMcpTool(row.tool, {
        serverName: row.serverName,
        serverUrl: row.serverUrl,
        serverEnabled: row.serverEnabled,
      })
    : null;
}

export async function isMcpToolActivatedForSession({
  organizationId,
  sessionId,
  surface,
  toolId,
}: {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
  toolId: string;
}) {
  const now = new Date();
  const [row] = await db
    .select({ id: mcpSessionToolActivations.id })
    .from(mcpSessionToolActivations)
    .where(
      and(
        eq(mcpSessionToolActivations.organizationId, organizationId),
        eq(mcpSessionToolActivations.sessionId, sessionId),
        eq(mcpSessionToolActivations.surface, surface),
        eq(mcpSessionToolActivations.mcpToolIndexId, toolId),
        or(
          isNull(mcpSessionToolActivations.expiresAt),
          gt(mcpSessionToolActivations.expiresAt, now)
        )
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function touchMcpSessionToolActivation({
  organizationId,
  sessionId,
  surface,
  toolId,
}: {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
  toolId: string;
}) {
  await db
    .update(mcpSessionToolActivations)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(mcpSessionToolActivations.organizationId, organizationId),
        eq(mcpSessionToolActivations.sessionId, sessionId),
        eq(mcpSessionToolActivations.surface, surface),
        eq(mcpSessionToolActivations.mcpToolIndexId, toolId)
      )
    );
}

export async function markMcpToolIndexRowStale({
  organizationId,
  toolId,
  errorMessage,
}: {
  organizationId: string;
  toolId: string;
  errorMessage?: string;
}) {
  await db
    .update(mcpToolIndex)
    .set({
      status: "stale",
      errorMessage: errorMessage ? sanitizeErrorMessage(errorMessage) : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpToolIndex.id, toolId),
        eq(mcpToolIndex.organizationId, organizationId)
      )
    );
}

export async function getEnabledMcpServerCount(organizationId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(mcpServerIntegrations)
    .where(
      and(
        eq(mcpServerIntegrations.organizationId, organizationId),
        eq(mcpServerIntegrations.enabled, true)
      )
    );
  return Number(row?.value ?? 0);
}

function decryptHeaders(encryptedHeaders: Record<string, string> | null) {
  return Object.fromEntries(
    Object.entries(encryptedHeaders ?? {}).map(([key, value]) => [
      key,
      decryptToken(value),
    ])
  );
}

async function upsertIndexedTool({
  organizationId,
  integration,
  definition,
}: {
  organizationId: string;
  integration: {
    id: string;
    name: string;
    description: string | null;
  };
  definition: McpToolDefinition;
}) {
  const runtimeToolName = await createUniqueRuntimeToolName({
    organizationId,
    integrationId: integration.id,
    serverName: integration.name,
    serverToolName: definition.name,
  });
  const searchText = createSearchText({
    integrationName: integration.name,
    integrationDescription: integration.description,
    definition,
    runtimeToolName,
  });
  const schemaHash = hashStable({
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: definition.inputSchema,
    outputSchema: definition.outputSchema,
    annotations: definition.annotations,
    meta: definition._meta,
  });

  try {
    await upsertIndexedToolWithRuntimeName({
      organizationId,
      integrationId: integration.id,
      definition,
      runtimeToolName,
      searchText,
      schemaHash,
    });
  } catch (error) {
    if (!isRuntimeToolNameConflict(error)) {
      throw error;
    }

    const collisionRuntimeToolName = createMcpRuntimeToolName({
      integrationId: integration.id,
      serverName: integration.name,
      serverToolName: definition.name,
      withHash: true,
    });
    await upsertIndexedToolWithRuntimeName({
      organizationId,
      integrationId: integration.id,
      definition,
      runtimeToolName: collisionRuntimeToolName,
      searchText: createSearchText({
        integrationName: integration.name,
        integrationDescription: integration.description,
        definition,
        runtimeToolName: collisionRuntimeToolName,
      }),
      schemaHash,
    });
  }
}

async function upsertIndexedToolWithRuntimeName({
  organizationId,
  integrationId,
  definition,
  runtimeToolName,
  searchText,
  schemaHash,
}: {
  organizationId: string;
  integrationId: string;
  definition: McpToolDefinition;
  runtimeToolName: string;
  searchText: string;
  schemaHash: string;
}) {
  await db
    .insert(mcpToolIndex)
    .values({
      id: `mcpt_${nanoid()}`,
      organizationId,
      serverIntegrationId: integrationId,
      serverToolName: definition.name,
      runtimeToolName,
      title: definition.title ?? definition.annotations?.title ?? null,
      description: definition.description ?? null,
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema ?? null,
      annotations: definition.annotations ?? null,
      meta: definition._meta ?? null,
      schemaHash,
      searchText,
      status: "active",
      lastSeenAt: new Date(),
      lastIndexedAt: new Date(),
      errorMessage: null,
    })
    .onConflictDoUpdate({
      target: [mcpToolIndex.serverIntegrationId, mcpToolIndex.serverToolName],
      set: {
        runtimeToolName,
        title: definition.title ?? definition.annotations?.title ?? null,
        description: definition.description ?? null,
        inputSchema: definition.inputSchema,
        outputSchema: definition.outputSchema ?? null,
        annotations: definition.annotations ?? null,
        meta: definition._meta ?? null,
        schemaHash,
        searchText,
        status: "active",
        lastSeenAt: new Date(),
        lastIndexedAt: new Date(),
        errorMessage: null,
        updatedAt: new Date(),
      },
    });
}

async function getToolsByIds(organizationId: string, toolIds: string[]) {
  if (!toolIds.length) {
    return [];
  }

  return db
    .select({
      tool: mcpToolIndex,
      serverName: mcpServerIntegrations.name,
      serverUrl: mcpServerIntegrations.url,
      serverEnabled: mcpServerIntegrations.enabled,
    })
    .from(mcpToolIndex)
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpToolIndex.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(
      and(
        eq(mcpToolIndex.organizationId, organizationId),
        inArray(mcpToolIndex.id, toolIds)
      )
    )
    .then((rows) =>
      rows.map((row) =>
        toIndexedMcpTool(row.tool, {
          serverName: row.serverName,
          serverUrl: row.serverUrl,
          serverEnabled: row.serverEnabled,
        })
      )
    );
}

function toIndexedMcpTool(
  row: typeof mcpToolIndex.$inferSelect,
  server: {
    serverName: string;
    serverUrl: string;
    serverEnabled: boolean;
  }
): IndexedMcpTool {
  return {
    id: row.id,
    organizationId: row.organizationId,
    serverIntegrationId: row.serverIntegrationId,
    serverToolName: row.serverToolName,
    runtimeToolName: row.runtimeToolName,
    title: row.title,
    description: row.description,
    inputSchema: row.inputSchema,
    outputSchema: row.outputSchema,
    annotations: row.annotations,
    meta: row.meta,
    schemaHash: row.schemaHash,
    searchText: row.searchText,
    status: row.status,
    serverName: server.serverName,
    serverUrl: server.serverUrl,
    serverEnabled: server.serverEnabled,
  };
}

async function createUniqueRuntimeToolName({
  organizationId,
  integrationId,
  serverName,
  serverToolName,
}: {
  organizationId: string;
  integrationId: string;
  serverName: string;
  serverToolName: string;
}) {
  const runtimeToolName = createMcpRuntimeToolName({
    integrationId,
    serverName,
    serverToolName,
  });
  const [existing] = await db
    .select({
      serverIntegrationId: mcpToolIndex.serverIntegrationId,
      serverToolName: mcpToolIndex.serverToolName,
    })
    .from(mcpToolIndex)
    .where(
      and(
        eq(mcpToolIndex.organizationId, organizationId),
        eq(mcpToolIndex.runtimeToolName, runtimeToolName)
      )
    )
    .limit(1);

  if (
    !existing ||
    (existing.serverIntegrationId === integrationId &&
      existing.serverToolName === serverToolName)
  ) {
    return runtimeToolName;
  }

  return createMcpRuntimeToolName({
    integrationId,
    serverName,
    serverToolName,
    withHash: true,
  });
}

function createSearchText({
  integrationName,
  integrationDescription,
  definition,
  runtimeToolName,
}: {
  integrationName: string;
  integrationDescription: string | null;
  definition: McpToolDefinition;
  runtimeToolName: string;
}) {
  return [
    integrationName,
    integrationDescription,
    runtimeToolName,
    definition.name,
    definition.title,
    definition.description,
    definition.annotations?.title,
    schemaPropertyNames(definition.inputSchema),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function schemaPropertyNames(inputSchema: unknown) {
  if (
    typeof inputSchema !== "object" ||
    inputSchema === null ||
    !("properties" in inputSchema)
  ) {
    return "";
  }
  const properties = (inputSchema as { properties?: unknown }).properties;
  if (typeof properties !== "object" || properties === null) {
    return "";
  }
  return Object.keys(properties).join(" ");
}

function hashStable(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(sortJson(value)))
    .digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortJson(nested)])
  );
}

function sanitizeErrorMessage(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 1000);
}

function isRuntimeToolNameConflict(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes("mcpToolIndex_org_runtime_tool_uidx") ||
    error.message.includes(
      "mcp_tool_index_organization_id_runtime_tool_name"
    ) ||
    error.message.includes("runtime_tool_name")
  );
}
