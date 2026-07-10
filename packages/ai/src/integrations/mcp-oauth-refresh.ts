import { auth, type OAuthTokens } from "@ai-sdk/mcp";
import { db } from "@notra/db/drizzle";
import { mcpOAuthCredentials, mcpServerIntegrations } from "@notra/db/schema";
import { and, eq, ne } from "drizzle-orm";
import {
  MCP_OAUTH_REFRESH_LEASE_MS,
  MCP_OAUTH_REFRESH_WAIT_ATTEMPTS,
  MCP_OAUTH_REFRESH_WAIT_MS,
} from "../constants/mcp-auth";
import {
  mcpOAuthAuthorizationServerInformationSchema,
  mcpOAuthClientInformationSchema,
  mcpOAuthTokensSchema,
} from "../schemas/mcp-oauth";
import type {
  McpRequestAuth,
  RefreshMcpOAuthRequestAuthParams,
} from "../types/mcp-oauth";
import {
  decryptMcpOAuthSecret,
  encryptMcpOAuthSecret,
} from "../utils/mcp-oauth-secrets";
import {
  getMcpAccessTokenExpiresAt,
  isMcpAccessTokenExpiring,
  toMcpOAuthRequestAuth,
} from "../utils/mcp-oauth-tokens";
import {
  McpOAuthAuthorizationError,
  McpOAuthReauthorizationRequiredError,
  McpOAuthRefreshTokenRequiredError,
  McpOAuthTokenError,
} from "./mcp-oauth-errors";
import {
  createMcpOAuthProvider,
  publicMcpOAuthFetch,
} from "./mcp-oauth-provider";

const TERMINAL_OAUTH_ERROR_CODES = new Set([
  "invalid_grant",
  "invalid_client",
  "unauthorized_client",
]);

function isTerminalOAuthError(error: unknown) {
  return (
    error instanceof McpOAuthReauthorizationRequiredError ||
    error instanceof McpOAuthRefreshTokenRequiredError ||
    (error instanceof McpOAuthTokenError &&
      TERMINAL_OAUTH_ERROR_CODES.has(error.code))
  );
}

export async function getStoredMcpOAuthCredential(
  organizationId: string,
  integrationId: string
) {
  const [row] = await db
    .select({
      credential: mcpOAuthCredentials,
      serverUrl: mcpServerIntegrations.url,
    })
    .from(mcpOAuthCredentials)
    .innerJoin(
      mcpServerIntegrations,
      eq(mcpOAuthCredentials.serverIntegrationId, mcpServerIntegrations.id)
    )
    .where(
      and(
        eq(mcpOAuthCredentials.organizationId, organizationId),
        eq(mcpOAuthCredentials.serverIntegrationId, integrationId)
      )
    )
    .limit(1);
  return row;
}

export async function getMcpOAuthRequestAuth(
  organizationId: string,
  integrationId: string
): Promise<McpRequestAuth> {
  const stored = await getStoredMcpOAuthCredential(
    organizationId,
    integrationId
  );
  if (!stored || stored.credential.status === "reauth_required") {
    throw new McpOAuthReauthorizationRequiredError();
  }
  if (isMcpAccessTokenExpiring(stored.credential.accessTokenExpiresAt)) {
    return refreshMcpOAuthRequestAuth({
      organizationId,
      integrationId,
      expectedTokenVersion: stored.credential.tokenVersion,
    });
  }
  const tokens = decryptMcpOAuthSecret(
    stored.credential.encryptedTokens,
    mcpOAuthTokensSchema
  );
  if (!tokens) {
    throw new McpOAuthReauthorizationRequiredError();
  }
  return toMcpOAuthRequestAuth(tokens, stored.credential.tokenVersion);
}

export async function refreshMcpOAuthRequestAuth({
  organizationId,
  integrationId,
  expectedTokenVersion,
}: RefreshMcpOAuthRequestAuthParams): Promise<McpRequestAuth> {
  let claimedTokenVersion: number | undefined;
  try {
    const stored = await getStoredMcpOAuthCredential(
      organizationId,
      integrationId
    );
    if (!stored || stored.credential.status === "reauth_required") {
      throw new McpOAuthReauthorizationRequiredError();
    }
    const currentTokens = decryptMcpOAuthSecret(
      stored.credential.encryptedTokens,
      mcpOAuthTokensSchema
    );
    if (!currentTokens?.refresh_token) {
      throw new McpOAuthRefreshTokenRequiredError();
    }
    const refreshIsCurrent =
      stored.credential.status === "refreshing" &&
      Date.now() - stored.credential.updatedAt.getTime() <
        MCP_OAUTH_REFRESH_LEASE_MS;
    if (refreshIsCurrent) {
      return waitForMcpOAuthRefresh(organizationId, integrationId);
    }
    if (
      stored.credential.status !== "refreshing" &&
      expectedTokenVersion !== undefined &&
      stored.credential.tokenVersion !== expectedTokenVersion
    ) {
      return toMcpOAuthRequestAuth(
        currentTokens,
        stored.credential.tokenVersion
      );
    }
    const [claim] = await db
      .update(mcpOAuthCredentials)
      .set({
        status: "refreshing",
        tokenVersion: stored.credential.tokenVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mcpOAuthCredentials.organizationId, organizationId),
          eq(mcpOAuthCredentials.serverIntegrationId, integrationId),
          eq(mcpOAuthCredentials.tokenVersion, stored.credential.tokenVersion),
          ne(mcpOAuthCredentials.status, "reauth_required")
        )
      )
      .returning({ tokenVersion: mcpOAuthCredentials.tokenVersion });
    if (!claim) {
      return waitForMcpOAuthRefresh(organizationId, integrationId);
    }
    claimedTokenVersion = claim.tokenVersion;
    return await refreshClaimedMcpOAuthCredential(
      claimedTokenVersion,
      currentTokens,
      integrationId,
      organizationId,
      stored
    );
  } catch (error) {
    if (isTerminalOAuthError(error)) {
      await markMcpOAuthReauthorizationRequired(
        organizationId,
        integrationId,
        claimedTokenVersion
      );
      throw new McpOAuthReauthorizationRequiredError();
    }
    if (claimedTokenVersion !== undefined) {
      await releaseMcpOAuthRefreshClaim(
        organizationId,
        integrationId,
        claimedTokenVersion,
        error
      );
    }
    throw error;
  }
}

async function refreshClaimedMcpOAuthCredential(
  claimedTokenVersion: number,
  currentTokens: OAuthTokens,
  integrationId: string,
  organizationId: string,
  stored: NonNullable<Awaited<ReturnType<typeof getStoredMcpOAuthCredential>>>
) {
  let savedTokens: OAuthTokens | undefined;
  let authorizationServerInformation = decryptMcpOAuthSecret(
    stored.credential.encryptedAuthorizationServerInformation,
    mcpOAuthAuthorizationServerInformationSchema
  );
  let clientInformation = decryptMcpOAuthSecret(
    stored.credential.encryptedClientInformation,
    mcpOAuthClientInformationSchema
  );
  const redirectUrl = clientInformation?.redirect_uris?.[0];
  if (!(clientInformation && redirectUrl)) {
    throw new McpOAuthReauthorizationRequiredError();
  }
  const provider = createMcpOAuthProvider({
    redirectUrl,
    state: {
      authorizationServerInformation,
      clientInformation,
      tokens: currentTokens,
    },
    onRedirect() {
      throw new McpOAuthReauthorizationRequiredError();
    },
    persistence: {
      async saveAuthorizationServerInformation(information) {
        authorizationServerInformation = information;
      },
      async saveClientInformation(information) {
        clientInformation = information;
      },
      async saveTokens(tokens) {
        savedTokens = tokens;
      },
    },
  });
  const result = await auth(provider, {
    serverUrl: stored.serverUrl,
    fetchFn: publicMcpOAuthFetch,
  });
  if (result !== "AUTHORIZED" || !savedTokens) {
    throw new McpOAuthReauthorizationRequiredError();
  }
  const refreshedTokens = savedTokens;
  const [persisted] = await db
    .update(mcpOAuthCredentials)
    .set({
      encryptedTokens: encryptMcpOAuthSecret(refreshedTokens),
      encryptedAuthorizationServerInformation: authorizationServerInformation
        ? encryptMcpOAuthSecret(authorizationServerInformation)
        : stored.credential.encryptedAuthorizationServerInformation,
      encryptedClientInformation: encryptMcpOAuthSecret(clientInformation),
      accessTokenExpiresAt: getMcpAccessTokenExpiresAt(refreshedTokens),
      status: "connected",
      lastRefreshedAt: new Date(),
      lastError: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpOAuthCredentials.organizationId, organizationId),
        eq(mcpOAuthCredentials.serverIntegrationId, integrationId),
        eq(mcpOAuthCredentials.tokenVersion, claimedTokenVersion),
        eq(mcpOAuthCredentials.status, "refreshing")
      )
    )
    .returning({ tokenVersion: mcpOAuthCredentials.tokenVersion });
  if (!persisted) {
    return waitForMcpOAuthRefresh(organizationId, integrationId);
  }
  return toMcpOAuthRequestAuth(refreshedTokens, persisted.tokenVersion);
}

async function waitForMcpOAuthRefresh(
  organizationId: string,
  integrationId: string
): Promise<McpRequestAuth> {
  for (
    let attempt = 0;
    attempt < MCP_OAUTH_REFRESH_WAIT_ATTEMPTS;
    attempt += 1
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, MCP_OAUTH_REFRESH_WAIT_MS)
    );
    const stored = await getStoredMcpOAuthCredential(
      organizationId,
      integrationId
    );
    if (!stored || stored.credential.status === "reauth_required") {
      throw new McpOAuthReauthorizationRequiredError();
    }
    if (stored.credential.status !== "refreshing") {
      const tokens = decryptMcpOAuthSecret(
        stored.credential.encryptedTokens,
        mcpOAuthTokensSchema
      );
      if (!tokens) {
        throw new McpOAuthReauthorizationRequiredError();
      }
      return toMcpOAuthRequestAuth(tokens, stored.credential.tokenVersion);
    }
  }
  throw new McpOAuthAuthorizationError("OAuth token refresh timed out.");
}

async function markMcpOAuthReauthorizationRequired(
  organizationId: string,
  integrationId: string,
  claimedTokenVersion?: number
) {
  await db
    .update(mcpOAuthCredentials)
    .set({
      status: "reauth_required",
      lastError: "OAuth authorization must be renewed.",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpOAuthCredentials.organizationId, organizationId),
        eq(mcpOAuthCredentials.serverIntegrationId, integrationId),
        ...(claimedTokenVersion === undefined
          ? []
          : [eq(mcpOAuthCredentials.tokenVersion, claimedTokenVersion)])
      )
    );
}

async function releaseMcpOAuthRefreshClaim(
  organizationId: string,
  integrationId: string,
  claimedTokenVersion: number,
  error: unknown
) {
  await db
    .update(mcpOAuthCredentials)
    .set({
      status: "connected",
      lastError:
        error instanceof Error ? error.message : "OAuth refresh failed.",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpOAuthCredentials.organizationId, organizationId),
        eq(mcpOAuthCredentials.serverIntegrationId, integrationId),
        eq(mcpOAuthCredentials.tokenVersion, claimedTokenVersion),
        eq(mcpOAuthCredentials.status, "refreshing")
      )
    );
}
