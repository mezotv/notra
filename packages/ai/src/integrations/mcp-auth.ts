import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { decryptToken } from "../crypto/token-encryption";
import type { McpHeaderMap } from "../types/integrations";
import type { McpRequestAuth } from "../types/mcp-oauth";
import { getMcpOAuthRequestAuth } from "./mcp-oauth";

function decryptHeaders(encryptedHeaders: McpHeaderMap | null): McpHeaderMap {
  return Object.fromEntries(
    Object.entries(encryptedHeaders ?? {}).map(([key, value]) => [
      key,
      decryptToken(value),
    ])
  );
}

export async function getMcpRequestAuth(
  integrationId: string,
  organizationId: string
): Promise<McpRequestAuth> {
  const [integration] = await db
    .select({
      authType: mcpServerIntegrations.authType,
      encryptedHeaders: mcpServerIntegrations.encryptedHeaders,
    })
    .from(mcpServerIntegrations)
    .where(
      and(
        eq(mcpServerIntegrations.id, integrationId),
        eq(mcpServerIntegrations.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!integration) {
    throw new Error("MCP server integration not found.");
  }

  if (integration.authType === "oauth") {
    return getMcpOAuthRequestAuth(organizationId, integrationId);
  }

  if (integration.authType === "headers") {
    return {
      authType: "headers",
      headers: decryptHeaders(integration.encryptedHeaders),
    };
  }

  return { authType: "none", headers: {} };
}
