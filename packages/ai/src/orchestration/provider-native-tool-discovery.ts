import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import {
  DEFAULT_NATIVE_TOOL_DISCOVERY_DESCRIPTION,
  NATIVE_MCP_DESCRIPTION,
  PROVIDER_TOOL_SEARCH_TOOL_NAME,
} from "@notra/ai/constants/provider-native-tool-discovery";
import type { StreamProviderOptions } from "@notra/ai/types/orchestration";
import type {
  AnthropicNativeMcpServer,
  ProviderNativeMcpRuntime,
  ProviderNativeToolDiscoveryProvider,
  ProviderNativeToolRuntime,
  ToolWithProviderOptions,
} from "@notra/ai/types/provider-native-tool-discovery";
import {
  createNativeMcpServerLabel,
  createNativeMcpToolName,
  getAuthorizationToken,
  getOpenAINamespaceForTool,
  getProviderNativeToolDiscoverySupport,
  getProviderOptionObject,
} from "@notra/ai/utils/provider-native-tool-discovery";
import type { Tool } from "ai";

export function createProviderNativeToolRuntime({
  modelId,
  tools,
  defaultActiveToolNames,
}: {
  modelId: string;
  tools: Record<string, Tool>;
  defaultActiveToolNames: string[];
}): ProviderNativeToolRuntime | null {
  const support = getProviderNativeToolDiscoverySupport(modelId);
  if (!support?.supportsToolSearch) {
    return null;
  }

  const defaultToolNameSet = new Set(defaultActiveToolNames);
  const nativeTools: Record<string, Tool> = {};

  for (const [toolName, toolDefinition] of Object.entries(tools)) {
    nativeTools[toolName] = withProviderNativeToolOptions({
      provider: support.provider,
      toolName,
      tool: toolDefinition,
      deferLoading: !defaultToolNameSet.has(toolName),
    });
  }

  nativeTools[PROVIDER_TOOL_SEARCH_TOOL_NAME] =
    support.provider === "openai"
      ? (openai.tools.toolSearch() as Tool)
      : (anthropic.tools.toolSearchBm25_20251119() as Tool);

  return {
    provider: support.provider,
    tools: nativeTools,
    descriptions: [DEFAULT_NATIVE_TOOL_DISCOVERY_DESCRIPTION],
  };
}

export async function createProviderNativeMcpRuntime({
  modelId,
  organizationId,
  hasMcp,
}: {
  modelId: string;
  organizationId: string;
  hasMcp: boolean;
}): Promise<ProviderNativeMcpRuntime> {
  if (!hasMcp) {
    return emptyNativeMcpRuntime(true);
  }

  const support = getProviderNativeToolDiscoverySupport(modelId);
  if (!support?.supportsNativeMcp) {
    return emptyNativeMcpRuntime(false);
  }

  const [
    { getDecryptedMcpHeaders, getMcpServerIntegrationsByOrganization },
    { assertPublicHttpUrlResolution },
  ] = await Promise.all([
    import("@notra/ai/integrations/mcp"),
    import("@notra/utils/url"),
  ]);
  const integrations = (
    await getMcpServerIntegrationsByOrganization(organizationId)
  ).filter((integration) => integration.enabled);

  if (!integrations.length) {
    return emptyNativeMcpRuntime(true);
  }

  if (support.provider === "openai") {
    const tools: Record<string, Tool> = {};
    for (const integration of integrations) {
      await assertPublicHttpUrlResolution(integration.url);
      const headers = await getDecryptedMcpHeaders(
        integration.id,
        organizationId
      );
      tools[createNativeMcpToolName(integration)] = openai.tools.mcp({
        serverLabel: createNativeMcpServerLabel(integration),
        serverDescription:
          integration.description ?? `MCP server ${integration.name}`,
        serverUrl: integration.url,
        headers,
        requireApproval: "always",
      }) as Tool;
    }

    return {
      handled: true,
      tools,
      descriptions: [NATIVE_MCP_DESCRIPTION],
    };
  }

  const mcpServers: AnthropicNativeMcpServer[] = [];
  for (const integration of integrations) {
    await assertPublicHttpUrlResolution(integration.url);
    const headers = await getDecryptedMcpHeaders(
      integration.id,
      organizationId
    );
    const authorizationToken = getAuthorizationToken(headers);
    if (!authorizationToken && Object.keys(headers).length > 0) {
      // Anthropic's current AI SDK provider option only supports an authorization
      // token for URL MCP servers. Preserve functionality via the local fallback
      // when an integration requires arbitrary headers.
      return emptyNativeMcpRuntime(false);
    }
    mcpServers.push({
      type: "url" as const,
      name: createNativeMcpServerLabel(integration),
      url: integration.url,
      ...(authorizationToken ? { authorizationToken } : {}),
      toolConfiguration: { enabled: true },
    });
  }

  return {
    handled: true,
    tools: {},
    providerOptions: {
      anthropic: {
        mcpServers,
      },
    } as unknown as StreamProviderOptions,
    descriptions: [NATIVE_MCP_DESCRIPTION],
  };
}

export function mergeProviderOptions(
  base?: StreamProviderOptions,
  extension?: StreamProviderOptions
): StreamProviderOptions | undefined {
  if (!base) {
    return extension;
  }
  if (!extension) {
    return base;
  }

  return {
    ...base,
    ...extension,
    openai:
      base.openai || extension.openai
        ? {
            ...(base.openai ?? {}),
            ...(extension.openai ?? {}),
          }
        : undefined,
    anthropic:
      base.anthropic || extension.anthropic
        ? {
            ...(base.anthropic ?? {}),
            ...(extension.anthropic ?? {}),
          }
        : undefined,
    gateway:
      base.gateway || extension.gateway
        ? {
            ...(base.gateway ?? {}),
            ...(extension.gateway ?? {}),
          }
        : undefined,
  } as StreamProviderOptions;
}

function withProviderNativeToolOptions({
  provider,
  toolName,
  tool,
  deferLoading,
}: {
  provider: ProviderNativeToolDiscoveryProvider;
  toolName: string;
  tool: Tool;
  deferLoading: boolean;
}): Tool {
  const currentProviderOptions =
    (tool as ToolWithProviderOptions).providerOptions ?? {};

  if (provider === "openai") {
    return {
      ...tool,
      providerOptions: {
        ...currentProviderOptions,
        openai: {
          ...getProviderOptionObject(currentProviderOptions.openai),
          namespace: getOpenAINamespaceForTool(toolName),
          ...(deferLoading ? { deferLoading: true } : {}),
        },
      },
    } as unknown as Tool;
  }

  return {
    ...tool,
    providerOptions: {
      ...currentProviderOptions,
      anthropic: {
        ...getProviderOptionObject(currentProviderOptions.anthropic),
        ...(deferLoading ? { deferLoading: true } : {}),
      },
    },
  } as unknown as Tool;
}

function emptyNativeMcpRuntime(handled: boolean): ProviderNativeMcpRuntime {
  return {
    handled,
    tools: {},
    descriptions: [],
  };
}
