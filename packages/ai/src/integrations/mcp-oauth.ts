import {
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
  exchangeAuthorization,
  refreshAuthorization,
  registerClient,
  startAuthorization,
} from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  AuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { db } from "@notra/db/drizzle";
import { mcpServerIntegrations } from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { and, eq } from "drizzle-orm";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import type {
  CompleteMcpOauthAuthorizationParams,
  McpHeaderMap,
  McpIntegrationAuthState,
  StartMcpOauthAuthorizationParams,
  StartMcpOauthAuthorizationResult,
} from "../types/integrations";

const OFFLINE_ACCESS_SCOPE = "offline_access";
const TOKEN_EXPIRY_SKEW_MS = 60_000;
const MS_PER_SECOND = 1000;
const MCP_OAUTH_CLIENT_NAME = "Notra";

export class McpOauthError extends Error {}

const inFlightRefreshes = new Map<string, Promise<string>>();

interface McpOauthDiscovery {
  authorizationServerUrl: string;
  metadata: AuthorizationServerMetadata;
  resourceMetadata?: OAuthProtectedResourceMetadata;
  scope?: string;
}

async function discoverMcpOauth(serverUrl: string): Promise<McpOauthDiscovery> {
  const resourceMetadata = await discoverOAuthProtectedResourceMetadata(
    serverUrl
  ).catch(() => undefined);
  const authorizationServerUrl =
    resourceMetadata?.authorization_servers?.[0] ?? new URL(serverUrl).origin;
  await assertPublicHttpUrlResolution(authorizationServerUrl);

  const metadata = await discoverAuthorizationServerMetadata(
    authorizationServerUrl
  );
  if (!metadata) {
    throw new McpOauthError(
      "This MCP server does not advertise an OAuth authorization server. Connect it with API key headers instead."
    );
  }

  return {
    authorizationServerUrl,
    metadata,
    resourceMetadata,
    scope: buildRequestedScope(metadata, resourceMetadata),
  };
}

export async function startMcpOauthAuthorization(
  params: StartMcpOauthAuthorizationParams
): Promise<StartMcpOauthAuthorizationResult> {
  const discovery = await discoverMcpOauth(params.serverUrl);

  if (!discovery.metadata.registration_endpoint) {
    throw new McpOauthError(
      "This MCP server does not support automatic client registration. Connect it with API key headers instead."
    );
  }

  const clientInformation = await registerClient(
    discovery.authorizationServerUrl,
    {
      metadata: discovery.metadata,
      clientMetadata: {
        client_name: MCP_OAUTH_CLIENT_NAME,
        redirect_uris: [params.redirectUrl],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        ...(discovery.scope ? { scope: discovery.scope } : {}),
      },
    }
  );

  const resource = discovery.resourceMetadata
    ? new URL(discovery.resourceMetadata.resource)
    : undefined;

  const { authorizationUrl, codeVerifier } = await startAuthorization(
    discovery.authorizationServerUrl,
    {
      metadata: discovery.metadata,
      clientInformation,
      redirectUrl: params.redirectUrl,
      scope: discovery.scope,
      state: params.state,
      resource,
    }
  );

  return {
    authorizationUrl: authorizationUrl.toString(),
    context: {
      authorizationServerUrl: discovery.authorizationServerUrl,
      clientId: clientInformation.client_id,
      ...(clientInformation.client_secret
        ? { clientSecret: clientInformation.client_secret }
        : {}),
      ...(discovery.scope ? { scope: discovery.scope } : {}),
      ...(resource ? { resource: resource.toString() } : {}),
      codeVerifier,
    },
  };
}

export async function completeMcpOauthAuthorization(
  params: CompleteMcpOauthAuthorizationParams
) {
  const { context } = params;
  await assertPublicHttpUrlResolution(context.authorizationServerUrl);
  const metadata = await discoverAuthorizationServerMetadata(
    context.authorizationServerUrl
  );

  const tokens = await exchangeAuthorization(context.authorizationServerUrl, {
    metadata,
    clientInformation: {
      client_id: context.clientId,
      ...(context.clientSecret ? { client_secret: context.clientSecret } : {}),
    },
    authorizationCode: params.authorizationCode,
    codeVerifier: context.codeVerifier,
    redirectUri: params.redirectUri,
    resource: context.resource ? new URL(context.resource) : undefined,
  });

  const [updated] = await db
    .update(mcpServerIntegrations)
    .set({
      authType: "oauth",
      oauthAuthorizationServerUrl: context.authorizationServerUrl,
      oauthResource: context.resource ?? null,
      oauthScope: tokens.scope ?? context.scope ?? null,
      oauthClientId: context.clientId,
      encryptedOauthClientSecret: context.clientSecret
        ? encryptToken(context.clientSecret)
        : null,
      encryptedOauthAccessToken: encryptToken(tokens.access_token),
      encryptedOauthRefreshToken: tokens.refresh_token
        ? encryptToken(tokens.refresh_token)
        : null,
      oauthTokenExpiresAt: getTokenExpiry(tokens),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpServerIntegrations.id, params.integrationId),
        eq(mcpServerIntegrations.organizationId, params.organizationId)
      )
    )
    .returning({ id: mcpServerIntegrations.id });

  if (!updated) {
    throw new McpOauthError("MCP server integration not found.");
  }

  return { hasRefreshToken: Boolean(tokens.refresh_token) };
}

export async function getMcpIntegrationRequestHeaders(
  integration: McpIntegrationAuthState
): Promise<McpHeaderMap> {
  const headers = Object.fromEntries(
    Object.entries(integration.encryptedHeaders ?? {}).map(([key, value]) => [
      key,
      decryptToken(value),
    ])
  );

  if (integration.authType !== "oauth") {
    return headers;
  }

  const accessToken = await getValidMcpOauthAccessToken(integration);
  return { ...headers, Authorization: `Bearer ${accessToken}` };
}

function getValidMcpOauthAccessToken(
  integration: McpIntegrationAuthState
): Promise<string> {
  if (!integration.encryptedOauthAccessToken) {
    return Promise.reject(
      new McpOauthError(
        "This MCP server has not completed OAuth authorization yet."
      )
    );
  }

  const expiresAt = integration.oauthTokenExpiresAt;
  const isExpiring =
    expiresAt !== null &&
    expiresAt.getTime() - TOKEN_EXPIRY_SKEW_MS <= Date.now();
  if (!isExpiring) {
    return Promise.resolve(decryptToken(integration.encryptedOauthAccessToken));
  }

  if (!integration.encryptedOauthRefreshToken) {
    return Promise.reject(
      new McpOauthError(
        "The MCP server access token expired without a refresh token. Reconnect the server."
      )
    );
  }

  const existing = inFlightRefreshes.get(integration.id);
  if (existing) {
    return existing;
  }

  const refreshPromise = refreshMcpOauthAccessToken(integration).finally(() => {
    inFlightRefreshes.delete(integration.id);
  });
  inFlightRefreshes.set(integration.id, refreshPromise);
  return refreshPromise;
}

async function refreshMcpOauthAccessToken(
  integration: McpIntegrationAuthState
) {
  const { oauthAuthorizationServerUrl, oauthClientId } = integration;
  if (
    !(
      oauthAuthorizationServerUrl &&
      oauthClientId &&
      integration.encryptedOauthRefreshToken
    )
  ) {
    throw new McpOauthError(
      "The MCP server OAuth configuration is incomplete. Reconnect the server."
    );
  }

  await assertPublicHttpUrlResolution(oauthAuthorizationServerUrl);
  const metadata = await discoverAuthorizationServerMetadata(
    oauthAuthorizationServerUrl
  );

  try {
    const tokens = await refreshAuthorization(oauthAuthorizationServerUrl, {
      metadata,
      clientInformation: {
        client_id: oauthClientId,
        ...(integration.encryptedOauthClientSecret
          ? {
              client_secret: decryptToken(
                integration.encryptedOauthClientSecret
              ),
            }
          : {}),
      },
      refreshToken: decryptToken(integration.encryptedOauthRefreshToken),
      resource: integration.oauthResource
        ? new URL(integration.oauthResource)
        : undefined,
    });

    await db
      .update(mcpServerIntegrations)
      .set({
        encryptedOauthAccessToken: encryptToken(tokens.access_token),
        ...(tokens.refresh_token
          ? { encryptedOauthRefreshToken: encryptToken(tokens.refresh_token) }
          : {}),
        oauthTokenExpiresAt: getTokenExpiry(tokens),
        updatedAt: new Date(),
      })
      .where(eq(mcpServerIntegrations.id, integration.id));

    return tokens.access_token;
  } catch (error) {
    if (isInvalidGrantError(error)) {
      await clearMcpOauthTokens(integration.id);
      throw new McpOauthError(
        "The MCP server authorization expired. Reconnect the server."
      );
    }
    throw error;
  }
}

async function clearMcpOauthTokens(integrationId: string) {
  await db
    .update(mcpServerIntegrations)
    .set({
      encryptedOauthAccessToken: null,
      encryptedOauthRefreshToken: null,
      oauthTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(mcpServerIntegrations.id, integrationId));
}

function buildRequestedScope(
  metadata: AuthorizationServerMetadata,
  resourceMetadata: OAuthProtectedResourceMetadata | undefined
) {
  const scopes = new Set(resourceMetadata?.scopes_supported ?? []);
  if (metadata.scopes_supported?.includes(OFFLINE_ACCESS_SCOPE)) {
    scopes.add(OFFLINE_ACCESS_SCOPE);
  }
  return scopes.size > 0 ? Array.from(scopes).join(" ") : undefined;
}

function getTokenExpiry(tokens: OAuthTokens) {
  return typeof tokens.expires_in === "number"
    ? new Date(Date.now() + tokens.expires_in * MS_PER_SECOND)
    : null;
}

function isInvalidGrantError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if ("errorCode" in error && error.errorCode === "invalid_grant") {
    return true;
  }
  return error instanceof Error && error.message.includes("invalid_grant");
}
