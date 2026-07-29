import { randomUUID } from "node:crypto";
import {
  AGENT_CHAT_HEADER,
  AGENT_ORGANIZATION_HEADER,
  AGENT_SERVICE_USERNAME,
  AGENT_SESSION_ROUTE_PATH,
  AGENT_SURFACE_HEADER,
  AGENT_USE_MARKUP_HEADER,
  AGENT_USER_HEADER,
} from "@notra/ai/constants/agent";
import { db } from "@notra/db/drizzle";
import { agentSessions } from "@notra/db/schema";
import { getVercelOidcToken } from "@vercel/oidc";
import { and, desc, eq } from "drizzle-orm";
import { Client } from "eve/client";
import { agentCreateSessionResponseSchema } from "../../schemas/agent-chats";
import type { ApiAgentScope } from "../../types/agent";

const TRAILING_SLASH_PATTERN = /\/+$/;

function getNotraAgentUrl(): string {
  const url = process.env.EVE_NOTRA_AGENT_URL;
  if (!url) {
    throw new Error("EVE_NOTRA_AGENT_URL is not configured");
  }
  return url.replace(TRAILING_SLASH_PATTERN, "");
}

export function isAgentApiEnabled(): boolean {
  return Boolean(process.env.EVE_NOTRA_AGENT_URL);
}

export async function createAgentClient(scope: ApiAgentScope): Promise<Client> {
  const headers: Record<string, string> = {
    [AGENT_ORGANIZATION_HEADER]: scope.organizationId,
    [AGENT_SURFACE_HEADER]: "standalone-chat",
  };
  if (scope.userId) {
    headers[AGENT_USER_HEADER] = scope.userId;
  }
  if (scope.chatId) {
    headers[AGENT_CHAT_HEADER] = scope.chatId;
  }

  if (scope.useMarkup !== undefined) {
    headers[AGENT_USE_MARKUP_HEADER] = scope.useMarkup ? "true" : "false";
  }

  const clientOptions = {
    headers,
    host: getNotraAgentUrl(),
    redirect: "error" as const,
  };

  const password = process.env.EVE_NOTRA_AGENT_PASSWORD;
  if (password) {
    return new Client({
      ...clientOptions,
      auth: { basic: { password, username: AGENT_SERVICE_USERNAME } },
    });
  }

  const token = await getVercelOidcToken().catch(() => null);
  if (token) {
    return new Client({ ...clientOptions, auth: { vercelOidc: { token } } });
  }

  throw new Error(
    "Notra agent auth is not configured: set EVE_NOTRA_AGENT_PASSWORD or enable Vercel OIDC federation with an agent-side allowlist for this project"
  );
}

export async function createAgentChatSession(
  scope: ApiAgentScope,
  message: string
) {
  const client = await createAgentClient(scope);
  const response = await client.fetch(AGENT_SESSION_ROUTE_PATH, {
    body: JSON.stringify({ message }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Agent session creation failed with status ${response.status}: ${body.slice(0, 500)}`
    );
  }
  const payload = agentCreateSessionResponseSchema.parse(await response.json());

  const values = {
    id: randomUUID(),
    organizationId: scope.organizationId,
    userId: scope.userId ?? null,
    chatId: scope.chatId ?? null,
    surface: "standalone-chat",
    eveSessionId: payload.sessionId,
    continuationToken: payload.continuationToken,
  };
  try {
    await db.insert(agentSessions).values(values);
  } catch (insertError) {
    console.error("[agent] Session mapping insert failed; retrying once", {
      eveSessionId: payload.sessionId,
      insertError,
    });
    await db.insert(agentSessions).values(values);
  }

  return payload;
}

export async function getAgentSessionForOrganization(
  organizationId: string,
  eveSessionId: string
) {
  return await db.query.agentSessions.findFirst({
    where: and(
      eq(agentSessions.organizationId, organizationId),
      eq(agentSessions.eveSessionId, eveSessionId)
    ),
  });
}

export async function listAgentSessionsForOrganization(
  organizationId: string,
  limit: number
) {
  return await db.query.agentSessions.findMany({
    where: eq(agentSessions.organizationId, organizationId),
    orderBy: [desc(agentSessions.createdAt)],
    limit,
  });
}

export async function updateAgentSessionContinuationToken(
  eveSessionId: string,
  continuationToken: string
): Promise<void> {
  await db
    .update(agentSessions)
    .set({ continuationToken })
    .where(eq(agentSessions.eveSessionId, eveSessionId));
}
