import {
  CONTENT_TOOL_NAMES,
  FIRECRAWL_TOOL_NAMES,
  GITHUB_TOOL_NAMES,
  LINEAR_TOOL_NAMES,
  OPENAI_NAMESPACES,
  ORGANIZATION_TOOL_NAMES,
  SKILL_TOOL_NAMES,
} from "@notra/ai/constants/provider-native-tool-discovery";
import type {
  OpenAINamespace,
  ProviderNativeToolDiscoverySupport,
} from "@notra/ai/types/provider-native-tool-discovery";

const INVALID_TOOL_NAME_CHARS_REGEX = /[^a-z0-9_-]+/g;
const EDGE_UNDERSCORES_REGEX = /^_+|_+$/g;
const MCP_ID_PREFIX_REGEX = /^mcp_/;
const OPENAI_TOOL_SEARCH_MODEL_REGEX = /^gpt-5\.(?:[4-9]|\d{2,})(?:$|-|\.)/;
const OPENAI_FUTURE_MODEL_REGEX = /^gpt-[6-9](?:$|-|\.)/;
const OPENAI_NATIVE_MCP_MODEL_REGEX = /^(?:gpt-5|o[34])(?:$|-|\.)/;
const CLAUDE_VERSION_REGEX = /claude-[a-z]+-(\d+)(?:[.-](\d+))?/;

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

export function getProviderOptionObject(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

export function getOpenAINamespaceForTool(toolName: string): OpenAINamespace {
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
  if (FIRECRAWL_TOOL_NAMES.has(toolName)) {
    return OPENAI_NAMESPACES.firecrawl;
  }
  return OPENAI_NAMESPACES.dev;
}

export function createNativeMcpToolName(integration: {
  id: string;
  name: string;
}) {
  return sanitizeToolName(
    `mcp_${integration.name}_${getMcpIntegrationIdSuffix(integration.id)}`
  );
}

export function createNativeMcpServerLabel(integration: {
  id: string;
  name: string;
}) {
  return sanitizeToolName(
    `${integration.name}_${getMcpIntegrationIdSuffix(integration.id)}`
  );
}

export function getAuthorizationToken(headers: Record<string, string>) {
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === "authorization") {
      return value;
    }
  }
  return undefined;
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

function getMcpIntegrationIdSuffix(integrationId: string) {
  return integrationId.replace(MCP_ID_PREFIX_REGEX, "").slice(0, 10);
}

function sanitizeToolName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(INVALID_TOOL_NAME_CHARS_REGEX, "_")
    .replace(EDGE_UNDERSCORES_REGEX, "");
  return (normalized || "mcp_server").slice(0, 64);
}
