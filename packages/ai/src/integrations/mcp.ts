import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations, members } from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import type {
  CreateMcpServerIntegrationParams,
  McpHeaderMap,
  UpdateMcpServerIntegrationParams,
} from "../types/integrations";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

function encryptHeaders(headers: McpHeaderMap = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, encryptToken(value)])
  );
}

function decryptHeaders(encryptedHeaders: McpHeaderMap | null): McpHeaderMap {
  return Object.fromEntries(
    Object.entries(encryptedHeaders ?? {}).map(([key, value]) => [
      key,
      decryptToken(value),
    ])
  );
}

async function assertOrganizationMember(
  organizationId: string,
  userId: string
) {
  const member = await db.query.members.findFirst({
    where: and(
      eq(members.organizationId, organizationId),
      eq(members.userId, userId)
    ),
  });

  if (!member) {
    throw new Error("User does not have access to this organization.");
  }
}

export function serializeMcpServerIntegration<
  T extends {
    id: string;
    name: string;
    url: string;
    description: string | null;
    encryptedHeaders: McpHeaderMap;
    enabled: boolean;
    createdAt: Date;
    createdByUser?: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
  },
>(integration: T) {
  return {
    id: integration.id,
    name: integration.name,
    url: integration.url,
    description: integration.description,
    enabled: integration.enabled,
    headerNames: Object.keys(integration.encryptedHeaders ?? {}),
    hasHeaders: Object.keys(integration.encryptedHeaders ?? {}).length > 0,
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
      encryptedHeaders: encryptHeaders(params.headers),
    })
    .returning();

  if (!integration) {
    throw new Error("Failed to create MCP server integration.");
  }

  return integration;
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

  const [updated] = await db
    .update(mcpServerIntegrations)
    .set({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.url !== undefined ? { url: updates.url } : {}),
      ...(updates.description !== undefined
        ? { description: updates.description }
        : {}),
      ...(updates.headers !== undefined
        ? { encryptedHeaders: encryptHeaders(updates.headers) }
        : {}),
      ...(updates.enabled !== undefined ? { enabled: updates.enabled } : {}),
      updatedAt: new Date(),
    })
    .where(eq(mcpServerIntegrations.id, integrationId))
    .returning();

  return updated ?? null;
}

export async function deleteMcpServerIntegration(integrationId: string) {
  await db
    .delete(mcpServerIntegrations)
    .where(eq(mcpServerIntegrations.id, integrationId));
}

export async function getDecryptedMcpHeaders(
  integrationId: string,
  organizationId: string
) {
  const [integration] = await db
    .select({
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

  return decryptHeaders(integration?.encryptedHeaders ?? {});
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

    return {
      success: true,
      status: null,
      message: "MCP connection successful",
    };
  } catch (error) {
    return {
      success: false,
      status: null,
      message: "Could not reach the MCP server. Check the URL and headers.",
    };
  } finally {
    await client.close().catch(() => undefined);
  }
}
