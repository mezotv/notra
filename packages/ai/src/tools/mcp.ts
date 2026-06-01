import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import {
  getDecryptedMcpHeaders,
  getMcpServerIntegrationsByOrganization,
} from "@notra/ai/integrations/mcp";
import type { McpRuntimeTool, McpRuntimeToolSet } from "@notra/ai/types/tools";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import type { Tool } from "ai";

const MCP_ID_PREFIX_REGEX = /^mcp_/;
const INVALID_TOOL_NAME_CHARS_REGEX = /[^a-z0-9_-]+/g;
const EDGE_UNDERSCORES_REGEX = /^_+|_+$/g;
const MCP_TOOL_DISCOVERY_TIMEOUT_MS = 8000;

export async function createMcpRuntimeToolSet(
  organizationId: string
): Promise<McpRuntimeToolSet> {
  const integrations = await getEnabledMcpServerIntegrations(organizationId);

  if (!integrations.length) {
    return emptyMcpRuntimeToolSet();
  }

  const clients: MCPClient[] = [];
  const tools: Record<string, Tool> = {};
  const descriptions: string[] = [];
  const usedToolNames = new Set<string>();

  for (const integration of integrations) {
    try {
      await assertPublicHttpUrlResolution(integration.url);
      const headers = await getDecryptedMcpHeaders(
        integration.id,
        organizationId
      );
      const client = await createMCPClient({
        clientName: "notra",
        version: "0.0.1",
        transport: {
          type: "http",
          url: integration.url,
          headers,
          redirect: "error",
        },
        onUncaughtError: (error) => {
          console.error("[MCP Client Error]", {
            integrationId: integration.id,
            organizationId,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      });

      clients.push(client);

      const definitions = await client.listTools({
        options: {
          signal: AbortSignal.timeout(MCP_TOOL_DISCOVERY_TIMEOUT_MS),
        },
      });
      const serverTools: Record<string, McpRuntimeTool> =
        client.toolsFromDefinitions(definitions);
      const toolNames = Object.keys(serverTools);
      if (!toolNames.length) {
        continue;
      }

      const prefix = createToolNamePrefix(integration);
      const runtimeToolNames: string[] = [];
      for (const [toolName, toolDefinition] of Object.entries(serverTools)) {
        const runtimeToolName = createUniqueToolName(
          `${prefix}_${sanitizeToolName(toolName)}`,
          usedToolNames
        );
        runtimeToolNames.push(runtimeToolName);
        const displayName = getToolDisplayName(toolName, toolDefinition);
        tools[runtimeToolName] = {
          ...toolDefinition,
          title: `${integration.name} - ${displayName}`,
          metadata: {
            ...(toolDefinition.metadata ?? {}),
            notra: {
              type: "mcp",
              serverId: integration.id,
              serverName: integration.name,
              toolName,
              label: `${integration.name} - ${displayName}`,
            },
          },
        };
      }

      descriptions.push(
        formatMcpCapabilityDescription(integration, runtimeToolNames)
      );
    } catch (error) {
      console.error("[MCP Tool Load Error]", {
        integrationId: integration.id,
        organizationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    tools,
    descriptions,
    cleanup: async () => {
      await Promise.allSettled(clients.map((client) => client.close()));
    },
  };
}

async function getEnabledMcpServerIntegrations(organizationId: string) {
  try {
    return (
      await getMcpServerIntegrationsByOrganization(organizationId)
    ).filter((integration) => integration.enabled);
  } catch (error) {
    console.error("[MCP Tool Load Error]", {
      organizationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function emptyMcpRuntimeToolSet(): McpRuntimeToolSet {
  return {
    tools: {},
    descriptions: [],
    cleanup: async () => undefined,
  };
}

function createToolNamePrefix(integration: { id: string; name: string }) {
  const idSuffix = integration.id.replace(MCP_ID_PREFIX_REGEX, "").slice(0, 10);
  return sanitizeToolName(`mcp_${integration.name}_${idSuffix}`);
}

function createUniqueToolName(baseName: string, usedToolNames: Set<string>) {
  const normalizedBaseName = baseName.slice(0, 56) || "mcp_tool";
  let candidate = normalizedBaseName;
  let counter = 2;

  while (usedToolNames.has(candidate)) {
    candidate = `${normalizedBaseName}_${counter}`;
    counter += 1;
  }

  usedToolNames.add(candidate);
  return candidate;
}

function sanitizeToolName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(INVALID_TOOL_NAME_CHARS_REGEX, "_")
      .replace(EDGE_UNDERSCORES_REGEX, "") || "tool"
  );
}

function getToolDisplayName(toolName: string, toolDefinition: McpRuntimeTool) {
  return toolDefinition.title ?? toolName;
}

function formatMcpCapabilityDescription(
  integration: { name: string; description: string | null },
  toolNames: string[]
) {
  const name = sanitizePromptText(integration.name, 80);
  const description = sanitizePromptText(
    integration.description ?? "Custom MCP server",
    240
  );
  const tools = toolNames.map((toolName) => sanitizePromptText(toolName, 80));

  return `**MCP: ${name}**: ${description}. Available tool names: ${tools.join(", ")}`;
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
