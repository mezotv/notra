export const MCP_MANAGER_TOOL_NAMES = [
  "searchMcpTools",
  "activateMcpTools",
  "listActiveMcpTools",
  "deactivateMcpTools",
] as const;

export const MCP_STALE_TOOL_ERROR_REGEX =
  /unknown tool|tool.*not found|no such tool|method not found|invalid params.*schema|schema validation|input schema|output schema|invalid request.*tool/i;

export const LAZY_MCP_DESCRIPTION =
  "MCP tools are available through lazy discovery. Use searchMcpTools to find external tools by intent, activateMcpTools before using them, then call the activated runtime tool by name. Do not invent MCP tool names.";
