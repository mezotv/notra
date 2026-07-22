export const MCP_STORE_CATEGORIES = [
  "AI",
  "Source control",
  "Project management",
  "Communication",
  "Design",
  "Notes",
  "Deploys",
  "Productivity",
] as const;

export type McpStoreCategory = (typeof MCP_STORE_CATEGORIES)[number];
