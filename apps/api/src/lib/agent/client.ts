import {
  AGENT_CHARGE_AI_CREDITS_HEADER,
  AGENT_CHAT_HEADER,
  AGENT_ORGANIZATION_HEADER,
  AGENT_SERVICE_USERNAME,
  AGENT_SURFACE_HEADER,
  AGENT_USE_MARKUP_HEADER,
  AGENT_USER_HEADER,
} from "@notra/ai/constants/agent";
import { getVercelOidcToken } from "@vercel/oidc";
import { Client } from "eve/client";

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
  if (scope.chargeAiCredits !== undefined) {
    headers[AGENT_CHARGE_AI_CREDITS_HEADER] = scope.chargeAiCredits
      ? "true"
      : "false";
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
