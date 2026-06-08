import { getMcpFaviconUrl } from "@/lib/integrations/mcp";
import { mcpToolMetadataSchema } from "@/schemas/ai/chat-tool-block";
import {
  MCP_TOOL_NAME_REGEX,
  NON_ALPHANUMERIC_WORD_SEPARATOR_REGEX,
  TITLE_CASE_WORD_REGEX,
  UNDERSCORE_REGEX,
} from "./constants";

export function isMcpToolName(toolName: string) {
  return MCP_TOOL_NAME_REGEX.test(toolName);
}

function formatToolDisplayName(value: string): string {
  return value
    .replace(NON_ALPHANUMERIC_WORD_SEPARATOR_REGEX, " ")
    .trim()
    .replace(TITLE_CASE_WORD_REGEX, (match) => match.toUpperCase());
}

function formatMcpToolName(toolName: string): string {
  const label = toolName
    .replace(MCP_TOOL_NAME_REGEX, "")
    .replace(UNDERSCORE_REGEX, " ");
  const displayName = formatToolDisplayName(label);
  return displayName || "MCP Tool";
}

function formatMcpToolLabelPart(value: string): string {
  const label = formatToolDisplayName(value);
  return label || "MCP tool";
}

function getNotraMcpMetadata(toolMetadata: unknown) {
  const parsed = mcpToolMetadataSchema.safeParse(toolMetadata);
  return parsed.success ? parsed.data.notra : undefined;
}

export function getMcpToolLabel(toolName: string, toolMetadata: unknown) {
  const notraMetadata = getNotraMcpMetadata(toolMetadata);

  if (notraMetadata?.serverName && notraMetadata.toolName) {
    return `${notraMetadata.serverName} - ${formatMcpToolLabelPart(notraMetadata.toolName)}`;
  }

  if (notraMetadata?.label) {
    return formatMcpToolLabelPart(notraMetadata.label);
  }

  return formatMcpToolName(toolName);
}

export function getMcpToolIconUrl(toolMetadata: unknown) {
  const notraMetadata = getNotraMcpMetadata(toolMetadata);
  return getMcpFaviconUrl(notraMetadata?.serverUrl);
}
