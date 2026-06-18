import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { StreamProviderOptions } from "@notra/ai/types/orchestration";
import type { Tool } from "ai";

type ProviderNativeToolDiscoveryProvider = "openai" | "anthropic";

interface ProviderNativeToolDiscoverySupport {
  provider: ProviderNativeToolDiscoveryProvider;
  supportsToolSearch: boolean;
  supportsNativeMcp: boolean;
}

export interface ProviderNativeToolRuntime {
  provider: ProviderNativeToolDiscoveryProvider;
  tools: Record<string, Tool>;
  descriptions: string[];
}

export interface ProviderNativeMcpRuntime {
  handled: boolean;
  tools: Record<string, Tool>;
  providerOptions?: StreamProviderOptions;
  descriptions: string[];
}

type ToolWithProviderOptions = Tool & {
  providerOptions?: Record<string, unknown>;
};

interface OpenAINamespace extends Record<string, string> {
  name: string;
  description: string;
}

const PROVIDER_TOOL_SEARCH_TOOL_NAME = "toolSearch";

const DEFAULT_NATIVE_TOOL_DISCOVERY_DESCRIPTION =
  "Built-in Notra app tools use provider-native dynamic tool discovery. Common discovery tools are loaded immediately; content, brand, GitHub, Linear, and post tools are deferred and loaded by the provider only when relevant.";

const NATIVE_MCP_DESCRIPTION =
  "External MCP servers are connected through provider-native MCP support. The provider discovers server tools on demand without Notra loading MCP tool schemas up front.";

const OPENAI_NAMESPACES = {
  content: {
    name: "notra_content",
    description:
      "Notra content creation and post management tools for drafts, updates, lookup, and viewing.",
  },
  organization: {
    name: "notra_organization",
    description:
      "Notra organization tools for brand identities, brand references, and connected integrations.",
  },
  skills: {
    name: "notra_skills",
    description:
      "Notra writing skill discovery and loading tools for organization-specific guidance.",
  },
  github: {
    name: "notra_github",
    description:
      "GitHub integration tools for pull requests, releases, and commits.",
  },
  linear: {
    name: "notra_linear",
    description: "Linear integration tools for issues, projects, and cycles.",
  },
  search: {
    name: "notra_search",
    description: "Web search and miscellaneous information gathering tools.",
  },
  dev: {
    name: "notra_development",
    description: "Development-only Notra testing tools.",
  },
} satisfies Record<string, OpenAINamespace>;

const CONTENT_TOOL_NAMES = new Set([
  "createChangelog",
  "createBlogPost",
  "createTwitterPost",
  "createLinkedInPost",
  "createInvestorUpdate",
  "createImage",
  "updatePost",
  "viewPost",
  "getAvailablePosts",
  "getPost",
]);

const ORGANIZATION_TOOL_NAMES = new Set([
  "listBrandIdentities",
  "getBrandIdentity",
  "getAvailableIntegrations",
  "getAvailableBrandReferences",
]);

const SKILL_TOOL_NAMES = new Set(["listAvailableSkills", "getSkillByName"]);
const GITHUB_TOOL_NAMES = new Set([
  "getPullRequests",
  "getReleaseByTag",
  "getCommitsByTimeframe",
]);
const LINEAR_TOOL_NAMES = new Set([
  "getLinearIssues",
  "getLinearProjects",
  "getLinearCycles",
]);
const SEARCH_TOOL_NAMES = new Set(["webSearch"]);

const INVALID_TOOL_NAME_CHARS_REGEX = /[^a-z0-9_-]+/g;
const EDGE_UNDERSCORES_REGEX = /^_+|_+$/g;
const MCP_ID_PREFIX_REGEX = /^mcp_/;
const OPENAI_TOOL_SEARCH_MODEL_REGEX = /^gpt-5\.(?:[4-9]|\d{2,})(?:$|-|\.)/;
const OPENAI_FUTURE_MODEL_REGEX = /^gpt-[6-9](?:$|-|\.)/;
const OPENAI_NATIVE_MCP_MODEL_REGEX = /^(?:gpt-5|o[34])(?:$|-|\.)/;
const CLAUDE_VERSION_REGEX = /claude-[a-z]+-(\d+)(?:[.-](\d+))?/;

interface AnthropicNativeMcpServer {
  type: "url";
  name: string;
  url: string;
  authorizationToken?: string;
  toolConfiguration: { enabled: true };
}

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

export function getProviderNativeToolDiscoverySupport(
  modelId: string
): ProviderNativeToolDiscoverySupport | null {
  const normalizedModelId = normalizeGatewayModelId(modelId);

  if (normalizedModelId.startsWith("openai/")) {
    return {
      provider: "openai",
      supportsToolSearch: supportsOpenAIToolSearch(normalizedModelId),
      supportsNativeMcp: supportsOpenAINativeMcp(normalizedModelId),
    };
  }

  if (normalizedModelId.startsWith("anthropic/")) {
    return {
      provider: "anthropic",
      supportsToolSearch: supportsAnthropicToolSearch(normalizedModelId),
      supportsNativeMcp: supportsAnthropicNativeMcp(normalizedModelId),
    };
  }

  return null;
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

function getProviderOptionObject(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function getOpenAINamespaceForTool(toolName: string): OpenAINamespace {
  if (CONTENT_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.content;
  }
  if (ORGANIZATION_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.organization;
  }
  if (SKILL_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.skills;
  }
  if (GITHUB_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.github;
  }
  if (LINEAR_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.linear;
  }
  if (SEARCH_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.search;
  }
  return OPENAI_NAMESPACES.dev;
}

function supportsOpenAIToolSearch(modelId: string) {
  const modelName = stripProviderPrefix(modelId, "openai/");
  return (
    OPENAI_TOOL_SEARCH_MODEL_REGEX.test(modelName) ||
    OPENAI_FUTURE_MODEL_REGEX.test(modelName)
  );
}

function supportsOpenAINativeMcp(modelId: string) {
  const modelName = stripProviderPrefix(modelId, "openai/");
  if (modelName.startsWith("gpt-oss-")) {
    return false;
  }
  return OPENAI_NATIVE_MCP_MODEL_REGEX.test(modelName);
}

function supportsAnthropicToolSearch(modelId: string) {
  const modelName = stripProviderPrefix(modelId, "anthropic/");
  if (modelName.startsWith("claude-sonnet-")) {
    return getClaudeMajorMinor(modelName).major >= 4;
  }
  if (modelName.startsWith("claude-opus-")) {
    return getClaudeMajorMinor(modelName).major >= 4;
  }
  if (modelName.startsWith("claude-haiku-")) {
    const version = getClaudeMajorMinor(modelName);
    return version.major > 4 || (version.major === 4 && version.minor >= 5);
  }
  return (
    modelName.startsWith("claude-fable-5") ||
    modelName.startsWith("claude-mythos-5")
  );
}

function supportsAnthropicNativeMcp(modelId: string) {
  return supportsAnthropicToolSearch(modelId);
}

function getClaudeMajorMinor(modelName: string) {
  const match = modelName.match(CLAUDE_VERSION_REGEX);
  return {
    major: match?.[1] ? Number(match[1]) : 0,
    minor: match?.[2] ? Number(match[2]) : 0,
  };
}

function normalizeGatewayModelId(modelId: string) {
  return modelId.startsWith("vercel/")
    ? modelId.slice("vercel/".length)
    : modelId;
}

function stripProviderPrefix(modelId: string, prefix: string) {
  return modelId.startsWith(prefix) ? modelId.slice(prefix.length) : modelId;
}

function emptyNativeMcpRuntime(handled: boolean): ProviderNativeMcpRuntime {
  return {
    handled,
    tools: {},
    descriptions: [],
  };
}

function createNativeMcpToolName(integration: { id: string; name: string }) {
  return sanitizeToolName(
    `mcp_${integration.name}_${integration.id.replace(MCP_ID_PREFIX_REGEX, "").slice(0, 10)}`
  );
}

function createNativeMcpServerLabel(integration: { id: string; name: string }) {
  return sanitizeToolName(
    `${integration.name}_${integration.id.replace(MCP_ID_PREFIX_REGEX, "").slice(0, 10)}`
  );
}

function sanitizeToolName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(INVALID_TOOL_NAME_CHARS_REGEX, "_")
    .replace(EDGE_UNDERSCORES_REGEX, "");
  return (normalized || "mcp_server").slice(0, 64);
}

function getAuthorizationToken(headers: Record<string, string>) {
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === "authorization") {
      return value;
    }
  }
  return undefined;
}
