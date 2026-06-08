import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations } from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import {
  dynamicTool,
  jsonSchema,
  type PrepareStepFunction,
  type Tool,
  type ToolExecutionOptions,
  tool,
} from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { decryptToken } from "../crypto/token-encryption";
import {
  type ActivatedMcpTool,
  activateSessionMcpTools,
  deactivateSessionMcpTools,
  getIndexedMcpToolByRuntimeName,
  getSessionActivatedMcpTools,
  hasActiveIndexedMcpToolsForOrganization,
  type IndexedMcpTool,
  isMcpToolActivatedForSession,
  MCP_EXECUTION_TIMEOUT_MS,
  MCP_SEARCH_LIMIT_DEFAULT,
  MCP_SEARCH_LIMIT_MAX,
  MCP_SESSION_ACTIVE_TOOL_LIMIT,
  type McpSessionSurface,
  type McpToolDefinition,
  markMcpToolIndexRowStale,
  refreshMcpToolIndexForOrganization,
  searchMcpToolIndex,
  touchMcpSessionToolActivation,
} from "../integrations/mcp-tool-index";

export interface LazyMcpRuntimeParams {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
  baseActiveToolNames: string[];
  tools?: Record<string, Tool>;
  maxRuntimeTools?: number;
}

export interface LazyMcpRuntime {
  tools: Record<string, Tool>;
  initialActiveTools: string[];
  prepareStep: PrepareStepFunction<Record<string, Tool>>;
  descriptions: string[];
  cleanup: () => Promise<void>;
}

const MCP_MANAGER_TOOL_NAMES = [
  "searchMcpTools",
  "activateMcpTools",
  "listActiveMcpTools",
  "deactivateMcpTools",
] as const;

const MCP_STALE_TOOL_ERROR_REGEX =
  /unknown tool|tool.*not found|no such tool|method not found|invalid params.*schema|schema validation|input schema|output schema|invalid request.*tool/i;

const LAZY_MCP_DESCRIPTION =
  "MCP tools are available through lazy discovery. Use searchMcpTools to find external tools by intent, activateMcpTools before using them, then call the activated runtime tool by name. Do not invent MCP tool names.";

export async function createLazyMcpRuntime({
  organizationId,
  sessionId,
  surface,
  baseActiveToolNames,
  tools: sharedTools,
}: LazyMcpRuntimeParams): Promise<LazyMcpRuntime> {
  const clients = new Map<string, Promise<MCPClient>>();
  const hasActiveIndexedTools = await hasActiveIndexedMcpToolsForOrganization({
    organizationId,
  });
  if (!hasActiveIndexedTools) {
    await refreshMcpToolIndexForOrganization({ organizationId }).catch(
      (error) => {
        console.error("[Lazy MCP Runtime Index Refresh Error]", {
          organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    );
  }
  const activatedTools = await getSessionActivatedMcpTools({
    organizationId,
    sessionId,
    surface,
  });
  const activeMcpToolNames = new Set(
    activatedTools.map((tool) => tool.runtimeToolName)
  );

  const activeToolNames = new Set<string>([
    ...baseActiveToolNames,
    ...MCP_MANAGER_TOOL_NAMES,
    ...activeMcpToolNames,
  ]);

  const tools: Record<string, Tool> = sharedTools ?? {};

  const ensureRuntimeTool = (indexedTool: IndexedMcpTool) => {
    tools[indexedTool.runtimeToolName] ??= createRuntimeMcpTool({
      organizationId,
      sessionId,
      surface,
      indexedTool,
      clients,
    });
  };

  const setActiveTools = (mcpTools: ActivatedMcpTool[]) => {
    for (const tool of mcpTools) {
      ensureRuntimeTool(tool);
      activeMcpToolNames.add(tool.runtimeToolName);
      activeToolNames.add(tool.runtimeToolName);
    }
  };

  Object.assign(tools, {
    searchMcpTools: tool({
      description:
        "Search indexed MCP tools by capability, service, or parameter name. Use this before activating unknown external tools.",
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(MCP_SEARCH_LIMIT_MAX).optional(),
        serverIntegrationId: z.string().min(1).optional(),
      }),
      execute: async ({ query, limit, serverIntegrationId }) => {
        const results = await searchMcpToolIndex({
          organizationId,
          query,
          limit: limit ?? MCP_SEARCH_LIMIT_DEFAULT,
          serverIntegrationId,
        });
        return {
          results: results.map((result) => ({
            toolId: result.id,
            runtimeToolName: result.runtimeToolName,
            serverName: result.serverName,
            title: result.title ?? undefined,
            description: result.description ?? undefined,
            inputSchemaSummary: summarizeJsonSchema(result.inputSchema),
            alreadyActive: activeMcpToolNames.has(result.runtimeToolName),
          })),
        };
      },
    }),
    activateMcpTools: tool({
      description:
        "Activate one or more MCP tools for this chat session so they can be called on the next agent step.",
      inputSchema: z.object({
        toolIds: z.array(z.string().min(1)).min(1),
        reason: z.string().max(500).optional(),
      }),
      execute: async ({ toolIds, reason }) => {
        const activated = await activateSessionMcpTools({
          organizationId,
          sessionId,
          surface,
          toolIds,
          sourceQuery: reason,
        });
        setActiveTools(activated);

        return {
          activated: activated
            .filter((activatedTool) => toolIds.includes(activatedTool.id))
            .map((activatedTool) => ({
              toolId: activatedTool.id,
              runtimeToolName: activatedTool.runtimeToolName,
              title: activatedTool.title ?? undefined,
              description: activatedTool.description ?? undefined,
              inputSchema: activatedTool.inputSchema,
            })),
        };
      },
    }),
    listActiveMcpTools: tool({
      description:
        "List MCP tools currently active in this chat session and available for use.",
      inputSchema: z.object({}),
      execute: async () => {
        const active = await getSessionActivatedMcpTools({
          organizationId,
          sessionId,
          surface,
        });
        setActiveTools(active);
        return {
          activeTools: active.map((activeTool) => ({
            toolId: activeTool.id,
            runtimeToolName: activeTool.runtimeToolName,
            serverName: activeTool.serverName,
            title: activeTool.title ?? undefined,
            description: activeTool.description ?? undefined,
            inputSchemaSummary: summarizeJsonSchema(activeTool.inputSchema),
          })),
          limit: MCP_SESSION_ACTIVE_TOOL_LIMIT,
        };
      },
    }),
    deactivateMcpTools: tool({
      description:
        "Deactivate MCP tools that are no longer needed in this chat session.",
      inputSchema: z
        .object({
          toolIds: z.array(z.string().min(1)).optional(),
          runtimeToolNames: z.array(z.string().min(1)).optional(),
        })
        .refine(
          (value) =>
            Boolean(value.toolIds?.length) ||
            Boolean(value.runtimeToolNames?.length),
          "Provide toolIds or runtimeToolNames"
        ),
      execute: async ({ toolIds, runtimeToolNames }) => {
        const result = await deactivateSessionMcpTools({
          organizationId,
          sessionId,
          surface,
          toolIds,
          runtimeToolNames,
        });
        for (const runtimeToolName of runtimeToolNames ?? []) {
          activeMcpToolNames.delete(runtimeToolName);
          activeToolNames.delete(runtimeToolName);
        }
        if (toolIds?.length) {
          const active = await getSessionActivatedMcpTools({
            organizationId,
            sessionId,
            surface,
          });
          const nextActiveNames = new Set(
            active.map((activeTool) => activeTool.runtimeToolName)
          );
          for (const runtimeToolName of activeMcpToolNames) {
            if (!nextActiveNames.has(runtimeToolName)) {
              activeMcpToolNames.delete(runtimeToolName);
              activeToolNames.delete(runtimeToolName);
            }
          }
        }
        return result;
      },
    }),
  });

  setActiveTools(activatedTools);

  return {
    tools,
    initialActiveTools: Array.from(activeToolNames),
    prepareStep: async () => ({
      activeTools: Array.from(activeToolNames),
    }),
    descriptions: [
      LAZY_MCP_DESCRIPTION,
      ...formatActiveToolDescriptions(activatedTools),
    ],
    cleanup: async () => {
      const settledClients = await Promise.allSettled(clients.values());
      await Promise.allSettled(
        settledClients.flatMap((result) =>
          result.status === "fulfilled" ? [result.value.close()] : []
        )
      );
      clients.clear();
    },
  };
}

function createRuntimeMcpTool({
  organizationId,
  sessionId,
  surface,
  indexedTool,
  clients,
}: {
  organizationId: string;
  sessionId: string;
  surface: McpSessionSurface;
  indexedTool: IndexedMcpTool;
  clients: Map<string, Promise<MCPClient>>;
}): Tool {
  return dynamicTool({
    title: indexedTool.title ?? indexedTool.runtimeToolName,
    description:
      indexedTool.description ??
      `MCP tool ${indexedTool.serverToolName} from ${indexedTool.serverName}`,
    needsApproval: shouldRequireApproval(indexedTool.annotations),
    inputSchema: jsonSchema(toAiSdkInputJsonSchema(indexedTool.inputSchema)),
    execute: async (input, options) => {
      const isActivated = await isMcpToolActivatedForSession({
        organizationId,
        sessionId,
        surface,
        toolId: indexedTool.id,
      });

      if (!isActivated) {
        throw new Error(
          `MCP tool ${indexedTool.runtimeToolName} is not active for this session. Use activateMcpTools first.`
        );
      }

      try {
        const latestTool =
          (await getIndexedMcpToolByRuntimeName({
            organizationId,
            runtimeToolName: indexedTool.runtimeToolName,
          })) ?? indexedTool;
        if (latestTool.status !== "active" || !latestTool.serverEnabled) {
          throw new Error(
            `MCP tool ${indexedTool.runtimeToolName} is no longer available. Search and activate the tool again before retrying.`
          );
        }
        const client = await getMcpClient({
          organizationId,
          integrationId: latestTool.serverIntegrationId,
          clients,
        });
        const definitions = {
          tools: [toMcpToolDefinition(latestTool)],
        } as Awaited<ReturnType<MCPClient["listTools"]>>;
        const convertedTools = client.toolsFromDefinitions(definitions);
        const convertedTool = convertedTools[latestTool.serverToolName];
        if (!convertedTool?.execute) {
          throw new Error(
            `MCP tool ${latestTool.serverToolName} could not be prepared for execution.`
          );
        }

        const output = await convertedTool.execute(input, {
          ...options,
          abortSignal: withExecutionTimeout(options),
        });

        await touchMcpSessionToolActivation({
          organizationId,
          sessionId,
          surface,
          toolId: indexedTool.id,
        });

        return output;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isLikelySchemaOrUnknownToolError(message)) {
          await markMcpToolIndexRowStale({
            organizationId,
            toolId: indexedTool.id,
            errorMessage: message,
          });
          return {
            isError: true,
            message:
              "The MCP tool definition appears stale. Search and activate the tool again before retrying.",
          };
        }
        throw error;
      }
    },
    metadata: {
      notra: {
        type: "mcp",
        serverId: indexedTool.serverIntegrationId,
        serverName: indexedTool.serverName,
        serverUrl: indexedTool.serverUrl,
        toolName: indexedTool.serverToolName,
        runtimeToolName: indexedTool.runtimeToolName,
      },
    },
  });
}

async function getMcpClient({
  organizationId,
  integrationId,
  clients,
}: {
  organizationId: string;
  integrationId: string;
  clients: Map<string, Promise<MCPClient>>;
}) {
  const existing = clients.get(integrationId);
  if (existing) {
    return existing;
  }

  const promise = createMcpClientForIntegration({
    organizationId,
    integrationId,
  }).catch((error) => {
    clients.delete(integrationId);
    throw error;
  });
  clients.set(integrationId, promise);
  return promise;
}

async function createMcpClientForIntegration({
  organizationId,
  integrationId,
}: {
  organizationId: string;
  integrationId: string;
}) {
  const integration = await db.query.mcpServerIntegrations.findFirst({
    where: and(
      eq(mcpServerIntegrations.id, integrationId),
      eq(mcpServerIntegrations.organizationId, organizationId),
      eq(mcpServerIntegrations.enabled, true)
    ),
  });

  if (!integration) {
    throw new Error("MCP server integration is unavailable.");
  }

  await assertPublicHttpUrlResolution(integration.url);

  return createMCPClient({
    clientName: "notra",
    version: "0.0.1",
    transport: {
      type: "http",
      url: integration.url,
      headers: decryptHeaders(integration.encryptedHeaders),
      redirect: "error",
    },
    onUncaughtError: (error) => {
      console.error("[Lazy MCP Client Error]", {
        integrationId,
        organizationId,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}

function toMcpToolDefinition(indexedTool: IndexedMcpTool): McpToolDefinition {
  return {
    name: indexedTool.serverToolName,
    title: indexedTool.title ?? undefined,
    description: indexedTool.description ?? undefined,
    inputSchema: toMcpDefinitionInputSchema(indexedTool.inputSchema),
    outputSchema:
      typeof indexedTool.outputSchema === "object" &&
      indexedTool.outputSchema !== null
        ? (indexedTool.outputSchema as Record<string, unknown>)
        : undefined,
    annotations:
      typeof indexedTool.annotations === "object" &&
      indexedTool.annotations !== null
        ? (indexedTool.annotations as McpToolDefinition["annotations"])
        : undefined,
    _meta:
      typeof indexedTool.meta === "object" && indexedTool.meta !== null
        ? (indexedTool.meta as McpToolDefinition["_meta"])
        : undefined,
  };
}

function toAiSdkInputJsonSchema(
  inputSchema: unknown
): Parameters<typeof jsonSchema>[0] {
  return toMcpDefinitionInputSchema(inputSchema) as Parameters<
    typeof jsonSchema
  >[0];
}

function toMcpDefinitionInputSchema(
  inputSchema: unknown
): McpToolDefinition["inputSchema"] {
  if (typeof inputSchema !== "object" || inputSchema === null) {
    return { type: "object" as const, properties: {} };
  }

  const schema = inputSchema as Record<string, unknown>;
  return {
    ...schema,
    type: "object" as const,
    properties:
      typeof schema.properties === "object" && schema.properties !== null
        ? (schema.properties as Record<string, unknown>)
        : {},
  } as McpToolDefinition["inputSchema"];
}

function decryptHeaders(encryptedHeaders: Record<string, string> | null) {
  return Object.fromEntries(
    Object.entries(encryptedHeaders ?? {}).map(([key, value]) => [
      key,
      decryptToken(value),
    ])
  );
}

function withExecutionTimeout(options: ToolExecutionOptions) {
  const timeoutSignal = AbortSignal.timeout(MCP_EXECUTION_TIMEOUT_MS);
  return options.abortSignal
    ? AbortSignal.any([options.abortSignal, timeoutSignal])
    : timeoutSignal;
}

function summarizeJsonSchema(schema: unknown) {
  if (typeof schema !== "object" || schema === null) {
    return "No input parameters.";
  }

  const properties = (schema as { properties?: unknown }).properties;
  if (typeof properties !== "object" || properties === null) {
    return "No input parameters.";
  }

  const names = Object.keys(properties);
  if (names.length === 0) {
    return "No input parameters.";
  }

  return `Input parameters: ${names.slice(0, 12).join(", ")}${names.length > 12 ? ", ..." : ""}`;
}

function shouldRequireApproval(annotations: unknown) {
  if (typeof annotations !== "object" || annotations === null) {
    return true;
  }
  return (annotations as { readOnlyHint?: unknown }).readOnlyHint !== true;
}

function isLikelySchemaOrUnknownToolError(message: string) {
  return MCP_STALE_TOOL_ERROR_REGEX.test(message);
}

function formatActiveToolDescriptions(tools: ActivatedMcpTool[]) {
  return tools.slice(0, MCP_SESSION_ACTIVE_TOOL_LIMIT).map((tool) => {
    const title = sanitizePromptText(tool.title ?? tool.runtimeToolName, 80);
    const description = sanitizePromptText(
      tool.description ?? `MCP tool from ${tool.serverName}`,
      220
    );
    return `**Active MCP Tool: ${tool.runtimeToolName}** (${title}): ${description}`;
  });
}

function sanitizePromptText(value: string, maxLength: number) {
  const normalized = value
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? " " : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}
