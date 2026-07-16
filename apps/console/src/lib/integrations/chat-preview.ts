import {
  MCP_TOOL_TITLE_CASE_REGEX,
  MCP_TOOL_WORD_SEPARATOR_REGEX,
} from "@/lib/integrations/constants";

export function getMcpFaviconUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return;
  }
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  try {
    const domain = new URL(normalizedUrl).hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return;
  }
}

function formatToolDisplayName(value: string) {
  return value
    .replace(MCP_TOOL_WORD_SEPARATOR_REGEX, " ")
    .trim()
    .replace(MCP_TOOL_TITLE_CASE_REGEX, (match) => match.toUpperCase());
}

export function getPreviewToolLabel(serverName: string, toolName: string) {
  const server = serverName.trim();
  const tool = formatToolDisplayName(toolName) || "MCP tool";
  return server ? `${server} - ${tool}` : tool;
}
