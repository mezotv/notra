import { createHash } from "node:crypto";
import {
  auth,
  createMCPClient,
  type MCPClient,
  type OAuthAuthorizationServerInformation,
  type OAuthClientInformation,
  type OAuthTokens,
} from "@ai-sdk/mcp";
import { db } from "@notra/db/drizzle";
import {
  mcpOAuthCredentials,
  mcpOAuthPendingAuthorizations,
  mcpServerIntegrations,
} from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { Effect } from "effect";
import { customAlphabet } from "nanoid";
import { MCP_OAUTH_PENDING_TTL_MS } from "../constants/mcp-auth";
import {
  mcpOAuthAuthorizationServerInformationSchema,
  mcpOAuthClientInformationSchema,
  mcpOAuthSecretStringSchema,
} from "../schemas/mcp-oauth";
import type {
  BeginMcpOAuthAuthorizationParams,
  CompleteMcpOAuthAuthorizationParams,
  McpOAuthPendingSecrets,
} from "../types/mcp-oauth";
import {
  decryptMcpOAuthSecret,
  encryptMcpOAuthSecret,
} from "../utils/mcp-oauth-secrets";
import { getMcpAccessTokenExpiresAt } from "../utils/mcp-oauth-tokens";
import { hasMcpOrganizationAccess } from "./mcp-access";
import {
  McpOAuthAuthorizationError,
  McpOAuthNameConflictError,
  McpOAuthRefreshTokenRequiredError,
} from "./mcp-oauth-errors";
import {
  createMcpOAuthProvider,
  publicMcpOAuthFetch,
} from "./mcp-oauth-provider";
import { getStoredMcpOAuthCredential } from "./mcp-oauth-refresh";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
function hashOAuthState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

async function assertOrganizationMember(
  organizationId: string,
  userId: string
) {
  if (!(await hasMcpOrganizationAccess(organizationId, userId))) {
    throw new McpOAuthAuthorizationError(
      "You do not have access to this organization."
    );
  }
}

function createPendingAuthorizationPersistence(
  pendingId: string,
  secrets: McpOAuthPendingSecrets
) {
  return {
    async saveAuthorizationServerInformation(
      information: OAuthAuthorizationServerInformation
    ) {
      secrets.encryptedAuthorizationServerInformation =
        encryptMcpOAuthSecret(information);
      await db
        .update(mcpOAuthPendingAuthorizations)
        .set({
          encryptedAuthorizationServerInformation:
            secrets.encryptedAuthorizationServerInformation,
          updatedAt: new Date(),
        })
        .where(eq(mcpOAuthPendingAuthorizations.id, pendingId));
    },
    async saveClientInformation(information: OAuthClientInformation) {
      secrets.encryptedClientInformation = encryptMcpOAuthSecret(information);
      await db
        .update(mcpOAuthPendingAuthorizations)
        .set({
          encryptedClientInformation: secrets.encryptedClientInformation,
          updatedAt: new Date(),
        })
        .where(eq(mcpOAuthPendingAuthorizations.id, pendingId));
    },
  };
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

  let authorizationUrl: URL | undefined;
  let client: MCPClient | undefined;
  const pendingSecrets: McpOAuthPendingSecrets = {
    encryptedAuthorizationServerInformation:
      existingCredential?.credential.encryptedAuthorizationServerInformation ??
      null,
    encryptedClientInformation:
      existingCredential?.credential.encryptedClientInformation ?? null,
  };
  const provider = createMcpOAuthProvider({
    redirectUrl: params.redirectUrl,
    state: {
      state,
      clientInformation: decryptMcpOAuthSecret(
        existingCredential?.credential.encryptedClientInformation,
        mcpOAuthClientInformationSchema
      ),
      authorizationServerInformation: decryptMcpOAuthSecret(
        existingCredential?.credential.encryptedAuthorizationServerInformation,
        mcpOAuthAuthorizationServerInformationSchema
      ),
    },
    onRedirect(url) {
      authorizationUrl = url;
    },
    persistence: {
      ...createPendingAuthorizationPersistence(id, pendingSecrets),
      async saveCodeVerifier(codeVerifier) {
        await db
          .update(mcpOAuthPendingAuthorizations)
          .set({
            encryptedCodeVerifier: encryptMcpOAuthSecret(codeVerifier),
            updatedAt: new Date(),
          })
          .where(eq(mcpOAuthPendingAuthorizations.id, id));
      },
    },
  });

  try {
    client = await createMCPClient({
      clientName: "notra-dashboard",
      version: "0.0.1",
      transport: {
        type: "http",
        url: params.url,
        authProvider: provider,
        fetch: publicMcpOAuthFetch,
        redirect: "error",
      },
    });
  } catch (error) {
    if (!authorizationUrl) {
      await db
        .delete(mcpOAuthPendingAuthorizations)
        .where(eq(mcpOAuthPendingAuthorizations.id, id));
      throw new McpOAuthAuthorizationError(
        error instanceof Error
          ? error.message
          : "Could not start MCP OAuth authorization."
      );
    }
  } finally {
    await client?.close().catch(() => undefined);
  }

  if (!authorizationUrl) {
    await db
      .delete(mcpOAuthPendingAuthorizations)
      .where(eq(mcpOAuthPendingAuthorizations.id, id));
    throw new McpOAuthAuthorizationError(
      "This MCP server did not request OAuth authorization."
    );
  }

  return { authorizationUrl: authorizationUrl.toString() };
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

  const state = decryptMcpOAuthSecret(
    pending.encryptedState,
    mcpOAuthSecretStringSchema
  );
  const codeVerifier = decryptMcpOAuthSecret(
    pending.encryptedCodeVerifier,
    mcpOAuthSecretStringSchema
  );
  const clientInformation = decryptMcpOAuthSecret(
    pending.encryptedClientInformation,
    mcpOAuthClientInformationSchema
  );
  const authorizationServerInformation = decryptMcpOAuthSecret(
    pending.encryptedAuthorizationServerInformation,
    mcpOAuthAuthorizationServerInformationSchema
  );

  if (!(state && codeVerifier)) {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth authorization request is incomplete or has expired."
    );
  }

  const pendingSecrets: McpOAuthPendingSecrets = {
    encryptedAuthorizationServerInformation:
      pending.encryptedAuthorizationServerInformation,
    encryptedClientInformation: pending.encryptedClientInformation,
  };
  let savedTokens: OAuthTokens | undefined;
  const provider = createMcpOAuthProvider({
    redirectUrl: params.redirectUrl,
    state: {
      authorizationServerInformation,
      clientInformation,
      codeVerifier,
      state,
    },
    onRedirect() {
      throw new McpOAuthAuthorizationError(
        "The MCP server requested authorization again."
      );
    },
    persistence: {
      ...createPendingAuthorizationPersistence(pending.id, pendingSecrets),
      async saveTokens(tokens) {
        savedTokens = tokens;
      },
    },
  });

  const result = await auth(provider, {
    serverUrl: pending.url,
    authorizationCode: params.code,
    callbackState: params.callbackState,
    fetchFn: publicMcpOAuthFetch,
  });

  if (result !== "AUTHORIZED") {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth authorization did not complete."
    );
  }

  if (!savedTokens) {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth token exchange did not return credentials."
    );
  }
  const tokens = savedTokens;
  const encryptedTokens = encryptMcpOAuthSecret(tokens);

  if (!tokens?.refresh_token) {
    await db
      .delete(mcpOAuthPendingAuthorizations)
      .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
    throw new McpOAuthRefreshTokenRequiredError();
  }

  const integrationId = pending.serverIntegrationId ?? `mcp_${nanoid()}`;
  await db.transaction(async (tx) => {
    if (pending.serverIntegrationId) {
      await tx
        .update(mcpOAuthCredentials)
        .set({
          connectedByUserId: pending.userId,
          encryptedTokens,
          encryptedClientInformation: pendingSecrets.encryptedClientInformation,
          encryptedAuthorizationServerInformation:
            pendingSecrets.encryptedAuthorizationServerInformation,
          accessTokenExpiresAt: getMcpAccessTokenExpiresAt(tokens),
          status: "connected",
          tokenVersion: sql`${mcpOAuthCredentials.tokenVersion} + 1`,
          lastError: null,
          updatedAt: new Date(),
        })
        .where(
          eq(
            mcpOAuthCredentials.serverIntegrationId,
            pending.serverIntegrationId
          )
        );
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
        encryptedClientInformation: pendingSecrets.encryptedClientInformation,
        encryptedAuthorizationServerInformation:
          pendingSecrets.encryptedAuthorizationServerInformation,
        accessTokenExpiresAt: getMcpAccessTokenExpiresAt(tokens),
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
  return cause instanceof Error
    ? cause
    : new McpOAuthAuthorizationError("The MCP OAuth request failed.");
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
