import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { db } from "@notra/db/drizzle";
import { mcpOAuthCredentials, mcpServerIntegrations } from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type {
  CreateMcpServerIntegrationParams,
  McpHeaderMap,
  McpServerIntegrationSerializationInput,
  UpdateMcpServerIntegrationParams,
} from "../types/integrations";
import type { McpAuthType } from "../types/mcp-oauth";
import { publicMcpRuntimeFetch } from "../utils/mcp-fetch";
import { encryptMcpHeaders } from "../utils/mcp-headers";
import { hasOrganizationAccess } from "../utils/organization-access";
import { refreshMcpToolIndexForIntegration } from "./mcp-tool-index";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

function getMcpAuthType(authType: string): McpAuthType {
  if (authType === "headers" || authType === "oauth") {
    return authType;
  }
  return "none";
}

function getMcpOAuthStatus(status: string | undefined) {
  if (status === "connected" || status === "refreshing") {
    return "connected" as const;
  }
  return status === "reauth_required"
    ? ("reauth_required" as const)
    : ("error" as const);
}

async function assertOrganizationMember(
  organizationId: string,
  userId: string
) {
  if (!(await hasOrganizationAccess(userId, organizationId))) {
    throw new Error("User does not have access to this organization.");
  }
}

export function serializeMcpServerIntegration(
  integration: McpServerIntegrationSerializationInput
) {
  return {
    id: integration.id,
    name: integration.name,
    url: integration.url,
    description: integration.description,
    authType: getMcpAuthType(integration.authType),
    oauthStatus:
      integration.authType === "oauth"
        ? getMcpOAuthStatus(integration.oauthCredential?.status)
        : null,
    enabled: integration.enabled,
    headerNames: Object.keys(integration.encryptedHeaders ?? {}),
    hasHeaders: Object.keys(integration.encryptedHeaders ?? {}).length > 0,
    lastToolSyncAt: integration.lastToolSyncAt?.toISOString() ?? null,
    toolSyncStatus: integration.toolSyncStatus ?? "idle",
    toolSyncError: integration.toolSyncError ?? null,
    indexedToolCount: integration.indexedToolCount ?? 0,
    createdAt: integration.createdAt.toISOString(),
    ...(integration.createdByUser
      ? { createdByUser: integration.createdByUser }
      : {}),
  };
}

export async function createMcpServerIntegration(
  params: CreateMcpServerIntegrationParams
) {
  await assertOrganizationMember(params.organizationId, params.userId);
  await assertPublicHttpUrlResolution(params.url);

  const [integration] = await db
    .insert(mcpServerIntegrations)
    .values({
      id: `mcp_${nanoid()}`,
      organizationId: params.organizationId,
      createdByUserId: params.userId,
      name: params.name,
      url: params.url,
      description: params.description ?? null,
      authType: params.authType,
      encryptedHeaders:
        params.authType === "headers" ? encryptMcpHeaders(params.headers) : {},
    })
    .returning();

  if (!integration) {
    throw new Error("Failed to create MCP server integration.");
  }

  await refreshMcpToolIndexForIntegration({
    organizationId: params.organizationId,
    integrationId: integration.id,
  }).catch(() => undefined);

  return (await getMcpServerIntegrationById(integration.id)) ?? integration;
}

export async function getMcpServerIntegrationById(integrationId: string) {
  const integration = await db.query.mcpServerIntegrations.findFirst({
    where: eq(mcpServerIntegrations.id, integrationId),
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      oauthCredential: {
        columns: {
          status: true,
        },
      },
    },
  });

  return integration ?? null;
}

export async function getMcpServerIntegrationsByOrganization(
  organizationId: string
) {
  return db.query.mcpServerIntegrations.findMany({
    where: eq(mcpServerIntegrations.organizationId, organizationId),
    with: {
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      oauthCredential: {
        columns: {
          status: true,
        },
      },
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

export async function hasEnabledMcpServerIntegrations(organizationId: string) {
  const integration = await db.query.mcpServerIntegrations.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(mcpServerIntegrations.organizationId, organizationId),
      eq(mcpServerIntegrations.enabled, true)
    ),
  });

  return Boolean(integration);
}

export async function updateMcpServerIntegration(
  integrationId: string,
  updates: UpdateMcpServerIntegrationParams
) {
  if (updates.url !== undefined) {
    await assertPublicHttpUrlResolution(updates.url);
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(mcpServerIntegrations)
      .set({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.url !== undefined ? { url: updates.url } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description }
          : {}),
        ...(updates.headers !== undefined
          ? { encryptedHeaders: encryptMcpHeaders(updates.headers) }
          : {}),
        ...(updates.authType !== undefined
          ? {
              authType: updates.authType,
              ...(updates.authType === "none" ? { encryptedHeaders: {} } : {}),
            }
          : {}),
        ...(updates.enabled !== undefined ? { enabled: updates.enabled } : {}),
        updatedAt: new Date(),
      })
      .where(eq(mcpServerIntegrations.id, integrationId))
      .returning();

    if (!row) {
      return null;
    }
    if (updates.authType) {
      await tx
        .delete(mcpOAuthCredentials)
        .where(eq(mcpOAuthCredentials.serverIntegrationId, integrationId));
    }
    return tx.query.mcpServerIntegrations.findFirst({
      where: eq(mcpServerIntegrations.id, integrationId),
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        oauthCredential: { columns: { status: true } },
      },
    });
  });

  if (updated) {
    await refreshMcpToolIndexForIntegration({
      organizationId: updated.organizationId,
      integrationId: updated.id,
    }).catch(() => undefined);
  }

  return updated ?? null;
}

export async function deleteMcpServerIntegration(integrationId: string) {
  await db
    .delete(mcpServerIntegrations)
    .where(eq(mcpServerIntegrations.id, integrationId));
}

export async function testMcpServerConnection(input: {
  url: string;
  headers?: McpHeaderMap;
}) {
  const timeoutMs = 8000;
  const client = new Client({ name: "notra-dashboard", version: "0.0.1" });

  try {
    await assertPublicHttpUrlResolution(input.url);
    const transport = new StreamableHTTPClientTransport(new URL(input.url), {
      fetch: publicMcpRuntimeFetch,
      requestInit: {
        headers: input.headers ?? {},
        redirect: "error",
      },
    });
    await client.connect(transport, {
      signal: AbortSignal.timeout(timeoutMs),
      timeout: timeoutMs,
    });
    await client.ping({
      signal: AbortSignal.timeout(timeoutMs),
      timeout: timeoutMs,
    });
    const definitions = await client.listTools(
      {},
      {
        signal: AbortSignal.timeout(timeoutMs),
        timeout: timeoutMs,
      }
    );
    const toolCount = definitions.tools.length;

    return {
      success: true,
      status: null,
      message: `MCP connection successful. Discovered ${toolCount} ${toolCount === 1 ? "tool" : "tools"}.`,
      toolCount,
    };
  } catch {
    return {
      success: false,
      status: null,
      message: "Could not reach the MCP server. Check the URL and headers.",
      toolCount: 0,
    };
  } finally {
    await client.close().catch(() => undefined);
  }
}
