import { createHash } from "node:crypto";

const MCP_ID_PREFIX_REGEX = /^mcp_/;
const INVALID_TOOL_NAME_CHARS_REGEX = /[^a-z0-9_-]+/g;
const EDGE_UNDERSCORES_REGEX = /^_+|_+$/g;
const MAX_RUNTIME_TOOL_NAME_LENGTH = 64;

export function createMcpRuntimeToolName({
  integrationId,
  serverName,
  serverToolName,
  withHash = false,
}: {
  integrationId: string;
  serverName: string;
  serverToolName: string;
  withHash?: boolean;
}) {
  const idSuffix = integrationId.replace(MCP_ID_PREFIX_REGEX, "").slice(0, 10);
  const base = sanitizeToolName(
    `mcp_${serverName}_${idSuffix}_${serverToolName}`
  );
  if (!withHash && base.length <= MAX_RUNTIME_TOOL_NAME_LENGTH) {
    return base;
  }

  const hash = hashStable({ integrationId, serverToolName }).slice(0, 8);
  const prefix = base.slice(0, MAX_RUNTIME_TOOL_NAME_LENGTH - hash.length - 1);
  return `${prefix}_${hash}`.replace(EDGE_UNDERSCORES_REGEX, "");
}

function sanitizeToolName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(INVALID_TOOL_NAME_CHARS_REGEX, "_")
      .replace(EDGE_UNDERSCORES_REGEX, "") || "mcp_tool"
  );
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
