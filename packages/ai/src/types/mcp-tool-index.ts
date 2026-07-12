import type { MCPClient } from "@ai-sdk/mcp";
import type { db } from "@notra/db/drizzle";

export type McpToolIndexStatus = "active" | "stale" | "unavailable" | "error";
export type McpToolSyncStatus = "idle" | "syncing" | "synced" | "error";
export type McpSessionSurface = "standalone-chat" | "editor-chat";

type McpListToolsResult = Awaited<ReturnType<MCPClient["listTools"]>>;
export type McpToolDefinition = McpListToolsResult["tools"][number];
export type McpToolIndexTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export interface IndexedMcpTool {
  id: string;
  organizationId: string;
  serverIntegrationId: string;
  serverToolName: string;
  runtimeToolName: string;
  title: string | null;
  description: string | null;
  inputSchema: unknown;
  outputSchema: unknown;
  annotations: unknown;
  meta: unknown;
  schemaHash: string;
  searchText: string;
  status: string;
  serverName: string;
  serverUrl: string;
  serverEnabled: boolean;
}

export interface ActivatedMcpTool extends IndexedMcpTool {
  activationId: string;
  sourceQuery: string | null;
  activatedAt: Date;
  lastUsedAt: Date | null;
}
