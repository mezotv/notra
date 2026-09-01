import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

import type { McpOAuthRetryParams, McpRequestAuth } from "../types/mcp-oauth";
import { isMcpUnauthorizedError } from "../utils/mcp-auth-error";
import { decryptMcpHeaders } from "../utils/mcp-headers";
import {
  getMcpOAuthRequestAuth,
  refreshMcpOAuthRequestAuth,
} from "./mcp-oauth-refresh";

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
      headers: decryptMcpHeaders(integration.encryptedHeaders),
    };
  }

  return { authType: "none", headers: {} };
}

export async function withMcpOAuthRetry<T>({
  integrationId,
  operation,
  organizationId,
  requestAuth,
}: McpOAuthRetryParams<T>) {
  try {
    return await operation(requestAuth, false);
  } catch (error) {
    if (requestAuth.authType !== "oauth" || !isMcpUnauthorizedError(error)) {
      throw error;
    }
    const refreshedAuth = await refreshMcpOAuthRequestAuth({
      organizationId,
      integrationId,
      expectedTokenVersion: requestAuth.oauthTokenVersion,
    });
    return operation(refreshedAuth, true);
  }
}
