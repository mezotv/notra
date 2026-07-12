import { createHash } from "node:crypto";
import {
  exchangeAuthorization,
  registerClient,
  startAuthorization,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { db } from "@notra/db/drizzle";
import {
  mcpOAuthCredentials,
  mcpOAuthPendingAuthorizations,
  mcpServerIntegrations,
} from "@notra/db/schema";
import {
  assertPublicHttpUrlResolution,
  PublicUrlValidationError,
} from "@notra/utils/url";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { Effect } from "effect";
import { customAlphabet } from "nanoid";
import { MCP_OAUTH_PENDING_TTL_MS } from "../constants/mcp-auth";
import {
  mcpOAuthClientInformationSchema,
  mcpOAuthSecretStringSchema,
  mcpOAuthStoredAuthorizationServerSchema,
} from "../schemas/mcp-oauth";
import type {
  BeginMcpOAuthAuthorizationParams,
  CompleteMcpOAuthAuthorizationParams,
} from "../types/mcp-oauth";
import {
  createMcpOAuthClientMetadata,
  isMcpOAuthClientRegistrationExpired,
} from "../utils/mcp-oauth-client";
import { publicMcpOAuthFetch } from "../utils/mcp-oauth-fetch";
import { getMcpOAuthRequestedScope } from "../utils/mcp-oauth-scope";
import {
  decryptMcpOAuthSecret,
  encryptMcpOAuthSecret,
} from "../utils/mcp-oauth-secrets";
import {
  getMcpAccessTokenExpiresAt,
  getMcpAccessTokenRefreshAt,
} from "../utils/mcp-oauth-tokens";
import { assertValidMcpOAuthAuthorizationUrl } from "../utils/mcp-oauth-url";
import { hasOrganizationAccess } from "../utils/organization-access";
import {
  discoverMcpOAuthServerConfiguration,
  restoreMcpOAuthServerConfiguration,
} from "./mcp-oauth-discovery";
import {
  McpOAuthAuthorizationError,
  McpOAuthNameConflictError,
  McpOAuthRefreshTokenRequiredError,
} from "./mcp-oauth-errors";
import { getStoredMcpOAuthCredential } from "./mcp-oauth-refresh";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
function hashOAuthState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

async function assertOrganizationMember(
  organizationId: string,
  userId: string
) {
  if (!(await hasOrganizationAccess(userId, organizationId))) {
    throw new McpOAuthAuthorizationError(
      "You do not have access to this organization."
    );
  }
}

async function beginMcpOAuthAuthorizationPromise(
  params: BeginMcpOAuthAuthorizationParams
) {
  const [existingCredential, existingName] = await Promise.all([
    params.serverIntegrationId
      ? getStoredMcpOAuthCredential(
          params.organizationId,
          params.serverIntegrationId
        )
      : Promise.resolve(undefined),
    params.serverIntegrationId
      ? Promise.resolve(undefined)
      : db.query.mcpServerIntegrations.findFirst({
          columns: { id: true },
          where: and(
            eq(mcpServerIntegrations.organizationId, params.organizationId),
            eq(mcpServerIntegrations.name, params.name)
          ),
        }),
    assertOrganizationMember(params.organizationId, params.userId),
    assertPublicHttpUrlResolution(params.url),
    deleteExpiredMcpOAuthAuthorizations(params.organizationId, params.userId),
  ]);

  const id = `mcpoauth_${nanoid()}`;
  const state = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + MCP_OAUTH_PENDING_TTL_MS);

  if (params.serverIntegrationId && !existingCredential) {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth connection could not be found."
    );
  }
  if (existingName) {
    throw new McpOAuthNameConflictError();
  }

  await db.insert(mcpOAuthPendingAuthorizations).values({
    id,
    organizationId: params.organizationId,
    userId: params.userId,
    serverIntegrationId: params.serverIntegrationId ?? null,
    name: params.name,
    url: params.url,
    description: params.description ?? null,
    callbackPath: params.callbackPath,
    stateHash: hashOAuthState(state),
    encryptedState: encryptMcpOAuthSecret(state),
    encryptedClientInformation:
      existingCredential?.credential.encryptedClientInformation ?? null,
    encryptedAuthorizationServerInformation:
      existingCredential?.credential.encryptedAuthorizationServerInformation ??
      null,
    expiresAt,
  });

  try {
    const configuration = await discoverMcpOAuthServerConfiguration(params.url);
    const scope = getMcpOAuthRequestedScope(configuration);
    let clientInformation =
      existingCredential?.credential.status === "reauth_required"
        ? undefined
        : decryptMcpOAuthSecret(
            existingCredential?.credential.encryptedClientInformation,
            mcpOAuthClientInformationSchema
          );
    if (
      clientInformation &&
      isMcpOAuthClientRegistrationExpired(clientInformation)
    ) {
      clientInformation = undefined;
    }
    if (!clientInformation) {
      if (!configuration.authorizationServerMetadata.registration_endpoint) {
        throw new McpOAuthAuthorizationError(
          "This MCP server does not support dynamic OAuth client registration."
        );
      }
      clientInformation = await registerClient(
        configuration.authorizationServerUrl,
        {
          metadata: configuration.authorizationServerMetadata,
          clientMetadata: createMcpOAuthClientMetadata(
            params.redirectUrl,
            scope
          ),
          scope,
          fetchFn: publicMcpOAuthFetch,
        }
      );
    }
    const { authorizationUrl, codeVerifier } = await startAuthorization(
      configuration.authorizationServerUrl,
      {
        metadata: configuration.authorizationServerMetadata,
        clientInformation,
        redirectUrl: params.redirectUrl,
        resource: configuration.resource,
        scope,
        state,
      }
    );
    await assertValidMcpOAuthAuthorizationUrl(authorizationUrl);
    await db
      .update(mcpOAuthPendingAuthorizations)
      .set({
        encryptedAuthorizationServerInformation: encryptMcpOAuthSecret(
          configuration.authorizationServerMetadata
        ),
        encryptedClientInformation: encryptMcpOAuthSecret(clientInformation),
        encryptedCodeVerifier: encryptMcpOAuthSecret(codeVerifier),
        updatedAt: new Date(),
      })
      .where(eq(mcpOAuthPendingAuthorizations.id, id));
    return { authorizationUrl: authorizationUrl.toString() };
  } catch (error) {
    await db
      .delete(mcpOAuthPendingAuthorizations)
      .where(eq(mcpOAuthPendingAuthorizations.id, id));
    if (
      error instanceof McpOAuthAuthorizationError ||
      error instanceof PublicUrlValidationError
    ) {
      throw error;
    }
    throw new McpOAuthAuthorizationError(
      "Could not start MCP OAuth authorization.",
      error
    );
  }
}

async function completeMcpOAuthAuthorizationPromise(
  params: CompleteMcpOAuthAuthorizationParams
) {
  const pending = await db.query.mcpOAuthPendingAuthorizations.findFirst({
    where: and(
      eq(
        mcpOAuthPendingAuthorizations.stateHash,
        hashOAuthState(params.callbackState)
      ),
      gt(mcpOAuthPendingAuthorizations.expiresAt, new Date())
    ),
  });

  if (!pending || pending.userId !== params.userId) {
    throw new McpOAuthAuthorizationError(
      "This MCP OAuth authorization request is invalid or has expired."
    );
  }

  await assertOrganizationMember(pending.organizationId, params.userId);

  const codeVerifier = decryptMcpOAuthSecret(
    pending.encryptedCodeVerifier,
    mcpOAuthSecretStringSchema
  );
  const clientInformation = decryptMcpOAuthSecret(
    pending.encryptedClientInformation,
    mcpOAuthClientInformationSchema
  );
  const storedAuthorizationServer = decryptMcpOAuthSecret(
    pending.encryptedAuthorizationServerInformation,
    mcpOAuthStoredAuthorizationServerSchema
  );

  if (!(codeVerifier && clientInformation && storedAuthorizationServer)) {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth authorization request is incomplete or has expired."
    );
  }
  const configuration = await restoreMcpOAuthServerConfiguration(
    pending.url,
    storedAuthorizationServer
  );
  const tokens = await exchangeAuthorization(
    configuration.authorizationServerUrl,
    {
      metadata: configuration.authorizationServerMetadata,
      clientInformation,
      authorizationCode: params.code,
      codeVerifier,
      redirectUri: params.redirectUrl,
      resource: configuration.resource,
      fetchFn: publicMcpOAuthFetch,
    }
  );
  const encryptedTokens = encryptMcpOAuthSecret(tokens);

  if (!tokens.refresh_token) {
    await db
      .delete(mcpOAuthPendingAuthorizations)
      .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
    throw new McpOAuthRefreshTokenRequiredError();
  }

  const integrationId = pending.serverIntegrationId ?? `mcp_${nanoid()}`;
  await db.transaction(async (tx) => {
    if (pending.serverIntegrationId) {
      const [updatedCredential] = await tx
        .update(mcpOAuthCredentials)
        .set({
          connectedByUserId: pending.userId,
          encryptedTokens,
          encryptedClientInformation: pending.encryptedClientInformation,
          encryptedAuthorizationServerInformation: encryptMcpOAuthSecret(
            configuration.authorizationServerMetadata
          ),
          accessTokenExpiresAt: getMcpAccessTokenExpiresAt(tokens),
          accessTokenRefreshAt: getMcpAccessTokenRefreshAt(tokens),
          status: "connected",
          tokenVersion: sql`${mcpOAuthCredentials.tokenVersion} + 1`,
          refreshLeaseId: null,
          refreshLeaseExpiresAt: null,
          lastError: null,
          updatedAt: new Date(),
        })
        .where(
          eq(
            mcpOAuthCredentials.serverIntegrationId,
            pending.serverIntegrationId
          )
        )
        .returning({
          serverIntegrationId: mcpOAuthCredentials.serverIntegrationId,
        });
      if (!updatedCredential) {
        throw new McpOAuthAuthorizationError(
          "The MCP OAuth connection changed during authorization."
        );
      }
    } else {
      await tx.insert(mcpServerIntegrations).values({
        id: integrationId,
        organizationId: pending.organizationId,
        createdByUserId: pending.userId,
        name: pending.name,
        url: pending.url,
        description: pending.description,
        authType: "oauth",
        encryptedHeaders: {},
      });
      await tx.insert(mcpOAuthCredentials).values({
        serverIntegrationId: integrationId,
        organizationId: pending.organizationId,
        connectedByUserId: pending.userId,
        encryptedTokens,
        encryptedClientInformation: pending.encryptedClientInformation,
        encryptedAuthorizationServerInformation: encryptMcpOAuthSecret(
          configuration.authorizationServerMetadata
        ),
        accessTokenExpiresAt: getMcpAccessTokenExpiresAt(tokens),
        accessTokenRefreshAt: getMcpAccessTokenRefreshAt(tokens),
        status: "connected",
      });
    }
    await tx
      .delete(mcpOAuthPendingAuthorizations)
      .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
  });

  return {
    callbackPath: pending.callbackPath,
    integrationId,
    organizationId: pending.organizationId,
  };
}

function normalizeMcpOAuthEffectError(cause: unknown) {
  if (
    cause instanceof McpOAuthAuthorizationError ||
    cause instanceof McpOAuthNameConflictError ||
    cause instanceof McpOAuthRefreshTokenRequiredError ||
    cause instanceof PublicUrlValidationError
  ) {
    return cause;
  }
  return new McpOAuthAuthorizationError("The MCP OAuth request failed.", cause);
}

export const beginMcpOAuthAuthorization = Effect.fn(
  "beginMcpOAuthAuthorization"
)(function* (params: BeginMcpOAuthAuthorizationParams) {
  return yield* Effect.tryPromise({
    try: () => beginMcpOAuthAuthorizationPromise(params),
    catch: normalizeMcpOAuthEffectError,
  });
});

export const completeMcpOAuthAuthorization = Effect.fn(
  "completeMcpOAuthAuthorization"
)(function* (params: CompleteMcpOAuthAuthorizationParams) {
  return yield* Effect.tryPromise({
    try: () => completeMcpOAuthAuthorizationPromise(params),
    catch: normalizeMcpOAuthEffectError,
  });
});

export async function getMcpOAuthCallbackPath(
  callbackState: string,
  userId: string
) {
  const pending = await db.query.mcpOAuthPendingAuthorizations.findFirst({
    columns: {
      callbackPath: true,
      userId: true,
    },
    where: and(
      eq(
        mcpOAuthPendingAuthorizations.stateHash,
        hashOAuthState(callbackState)
      ),
      gt(mcpOAuthPendingAuthorizations.expiresAt, new Date())
    ),
  });

  return pending?.userId === userId ? pending.callbackPath : undefined;
}

export async function cancelMcpOAuthAuthorization(
  callbackState: string,
  userId: string
) {
  const pending = await db.query.mcpOAuthPendingAuthorizations.findFirst({
    columns: { id: true, userId: true },
    where: eq(
      mcpOAuthPendingAuthorizations.stateHash,
      hashOAuthState(callbackState)
    ),
  });
  if (pending?.userId === userId) {
    await db
      .delete(mcpOAuthPendingAuthorizations)
      .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
  }
}

export async function deleteExpiredMcpOAuthAuthorizations(
  organizationId: string,
  userId: string
) {
  await db
    .delete(mcpOAuthPendingAuthorizations)
    .where(
      and(
        eq(mcpOAuthPendingAuthorizations.organizationId, organizationId),
        eq(mcpOAuthPendingAuthorizations.userId, userId),
        lt(mcpOAuthPendingAuthorizations.expiresAt, new Date())
      )
    );
}
