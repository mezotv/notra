export const MCP_SESSION_ACTIVE_TOOL_LIMIT = 20;
export const MCP_ACTIVATE_BATCH_LIMIT = 5;
export const MCP_SEARCH_LIMIT_DEFAULT = 8;
export const MCP_SEARCH_LIMIT_MAX = 15;
export const MCP_INDEX_TIMEOUT_MS = 15_000;
export const MCP_EXECUTION_TIMEOUT_MS = 30_000;
export const MCP_MAX_RUNTIME_WRAPPERS = 2000;

export const MCP_TOOL_ACTIVATION_OUTCOMES = {
  ACTIVATED: "activated",
  ALREADY_ACTIVE: "already_active",
} as const;
