import { createHash } from "node:crypto";
import {
  auth,
  createMCPClient,
  type MCPClient,
  type OAuthTokens,
} from "@ai-sdk/mcp";
import { db } from "@notra/db/drizzle";
import {
  mcpOAuthCredentials,
  mcpOAuthPendingAuthorizations,
  mcpServerIntegrations,
  members,
} from "@notra/db/schema";
import { assertPublicHttpUrlResolution } from "@notra/utils/url";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { Effect } from "effect";
import { customAlphabet } from "nanoid";
import {
  MCP_OAUTH_PENDING_TTL_MS,
  MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS,
} from "../constants/mcp-auth";
import {
  mcpOAuthAuthorizationServerInformationSchema,
  mcpOAuthClientInformationSchema,
  mcpOAuthSecretStringSchema,
  mcpOAuthTokensSchema,
} from "../schemas/mcp-oauth";
import type {
  BeginMcpOAuthAuthorizationParams,
  CompleteMcpOAuthAuthorizationParams,
  McpRequestAuth,
} from "../types/mcp-oauth";
import {
  decryptMcpOAuthSecret,
  encryptMcpOAuthSecret,
} from "../utils/mcp-oauth-secrets";
import {
  McpOAuthAuthorizationError,
  McpOAuthReauthorizationRequiredError,
  McpOAuthRefreshTokenRequiredError,
} from "./mcp-oauth-errors";
import {
  createMcpOAuthProvider,
  createPublicMcpOAuthFetch,
  publicMcpOAuthFetch,
} from "./mcp-oauth-provider";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
const TERMINAL_OAUTH_ERROR_REGEX =
  /invalid_grant|invalid_client|unauthorized_client|refresh token/i;

function hashOAuthState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

function getAccessTokenExpiresAt(tokens: OAuthTokens) {
  return tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;
}

function isAccessTokenExpiring(expiresAt: Date | null) {
  return Boolean(
    expiresAt &&
      expiresAt.getTime() - MCP_OAUTH_TOKEN_EXPIRY_BUFFER_MS <= Date.now()
  );
}

function isTerminalOAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return TERMINAL_OAUTH_ERROR_REGEX.test(message);
}

async function assertOrganizationMember(
  organizationId: string,
  userId: string
) {
  const membership = await db.query.members.findFirst({
    columns: { id: true },
    where: and(
      eq(members.organizationId, organizationId),
      eq(members.userId, userId)
    ),
  });

  if (!membership) {
    throw new McpOAuthAuthorizationError(
      "You do not have access to this organization."
    );
  }
}

async function beginMcpOAuthAuthorizationPromise(
  params: BeginMcpOAuthAuthorizationParams
) {
  await Promise.all([
    assertOrganizationMember(params.organizationId, params.userId),
    assertPublicHttpUrlResolution(params.url),
    deleteExpiredMcpOAuthAuthorizations(),
  ]);

  const id = `mcpoauth_${nanoid()}`;
  const state = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + MCP_OAUTH_PENDING_TTL_MS);

  const existingCredential = params.serverIntegrationId
    ? await getStoredOAuthCredential(
        params.organizationId,
        params.serverIntegrationId
      )
    : undefined;

  if (params.serverIntegrationId && !existingCredential) {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth connection could not be found."
    );
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
  let supportsOfflineAccess = false;
  let client: MCPClient | undefined;
  const oauthFetch = createPublicMcpOAuthFetch((scopes) => {
    supportsOfflineAccess = scopes.includes("offline_access");
  });
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
      if (supportsOfflineAccess) {
        const scopes = new Set(
          (url.searchParams.get("scope") ?? "").split(" ").filter(Boolean)
        );
        scopes.add("offline_access");
        url.searchParams.set("scope", Array.from(scopes).join(" "));
      }
      authorizationUrl = url;
    },
    persistence: {
      async saveAuthorizationServerInformation(information) {
        await db
          .update(mcpOAuthPendingAuthorizations)
          .set({
            encryptedAuthorizationServerInformation:
              encryptMcpOAuthSecret(information),
            updatedAt: new Date(),
          })
          .where(eq(mcpOAuthPendingAuthorizations.id, id));
      },
      async saveClientInformation(information) {
        await db
          .update(mcpOAuthPendingAuthorizations)
          .set({
            encryptedClientInformation: encryptMcpOAuthSecret(information),
            updatedAt: new Date(),
          })
          .where(eq(mcpOAuthPendingAuthorizations.id, id));
      },
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
        fetch: oauthFetch,
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
      async saveAuthorizationServerInformation(information) {
        await db
          .update(mcpOAuthPendingAuthorizations)
          .set({
            encryptedAuthorizationServerInformation:
              encryptMcpOAuthSecret(information),
            updatedAt: new Date(),
          })
          .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
      },
      async saveClientInformation(information) {
        await db
          .update(mcpOAuthPendingAuthorizations)
          .set({
            encryptedClientInformation: encryptMcpOAuthSecret(information),
            updatedAt: new Date(),
          })
          .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
      },
      async saveTokens(tokens) {
        await db
          .update(mcpOAuthPendingAuthorizations)
          .set({
            encryptedTokens: encryptMcpOAuthSecret(tokens),
            updatedAt: new Date(),
          })
          .where(eq(mcpOAuthPendingAuthorizations.id, pending.id));
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

  const completed = await db.query.mcpOAuthPendingAuthorizations.findFirst({
    where: eq(mcpOAuthPendingAuthorizations.id, pending.id),
  });
  if (!completed?.encryptedTokens) {
    throw new McpOAuthAuthorizationError(
      "The MCP OAuth token exchange did not return credentials."
    );
  }
  const encryptedTokens = completed.encryptedTokens;
  const tokens = decryptMcpOAuthSecret(encryptedTokens, mcpOAuthTokensSchema);

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
          encryptedClientInformation:
            completed.encryptedClientInformation ?? null,
          encryptedAuthorizationServerInformation:
            completed.encryptedAuthorizationServerInformation ?? null,
          accessTokenExpiresAt: getAccessTokenExpiresAt(tokens),
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
        encryptedClientInformation:
          completed.encryptedClientInformation ?? null,
        encryptedAuthorizationServerInformation:
          completed.encryptedAuthorizationServerInformation ?? null,
        accessTokenExpiresAt: getAccessTokenExpiresAt(tokens),
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

async function getStoredOAuthCredential(
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
  const stored = await getStoredOAuthCredential(organizationId, integrationId);
  if (!stored || stored.credential.status === "reauth_required") {
    throw new McpOAuthReauthorizationRequiredError();
  }

  if (isAccessTokenExpiring(stored.credential.accessTokenExpiresAt)) {
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

  return {
    authType: "oauth",
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    oauthTokenVersion: stored.credential.tokenVersion,
  };
}

export async function refreshMcpOAuthRequestAuth({
  organizationId,
  integrationId,
  expectedTokenVersion,
}: {
  organizationId: string;
  integrationId: string;
  expectedTokenVersion?: number;
}): Promise<McpRequestAuth> {
  try {
    return await db.transaction(async (tx) => {
      const [stored] = await tx
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
        .for("update");

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

      if (
        expectedTokenVersion !== undefined &&
        stored.credential.tokenVersion !== expectedTokenVersion
      ) {
        return {
          authType: "oauth" as const,
          headers: {
            Authorization: `Bearer ${currentTokens.access_token}`,
          },
          oauthTokenVersion: stored.credential.tokenVersion,
        };
      }

      let savedTokens: OAuthTokens | undefined;
      const provider = createMcpOAuthProvider({
        redirectUrl: "https://www.usenotra.com/oauth/refresh-not-supported",
        state: {
          authorizationServerInformation: decryptMcpOAuthSecret(
            stored.credential.encryptedAuthorizationServerInformation,
            mcpOAuthAuthorizationServerInformationSchema
          ),
          clientInformation: decryptMcpOAuthSecret(
            stored.credential.encryptedClientInformation,
            mcpOAuthClientInformationSchema
          ),
          tokens: currentTokens,
        },
        onRedirect() {
          throw new McpOAuthReauthorizationRequiredError();
        },
        persistence: {
          async saveAuthorizationServerInformation(information) {
            await tx
              .update(mcpOAuthCredentials)
              .set({
                encryptedAuthorizationServerInformation:
                  encryptMcpOAuthSecret(information),
                updatedAt: new Date(),
              })
              .where(
                eq(mcpOAuthCredentials.serverIntegrationId, integrationId)
              );
          },
          async saveClientInformation(information) {
            await tx
              .update(mcpOAuthCredentials)
              .set({
                encryptedClientInformation: encryptMcpOAuthSecret(information),
                updatedAt: new Date(),
              })
              .where(
                eq(mcpOAuthCredentials.serverIntegrationId, integrationId)
              );
          },
          async saveTokens(tokens) {
            savedTokens = tokens;
            await tx
              .update(mcpOAuthCredentials)
              .set({
                encryptedTokens: encryptMcpOAuthSecret(tokens),
                accessTokenExpiresAt: getAccessTokenExpiresAt(tokens),
                status: "connected",
                tokenVersion: stored.credential.tokenVersion + 1,
                lastRefreshedAt: new Date(),
                lastError: null,
                updatedAt: new Date(),
              })
              .where(
                eq(mcpOAuthCredentials.serverIntegrationId, integrationId)
              );
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

      return {
        authType: "oauth" as const,
        headers: { Authorization: `Bearer ${savedTokens.access_token}` },
        oauthTokenVersion: stored.credential.tokenVersion + 1,
      };
    });
  } catch (error) {
    if (isTerminalOAuthError(error)) {
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
            eq(mcpOAuthCredentials.serverIntegrationId, integrationId)
          )
        );
      throw new McpOAuthReauthorizationRequiredError();
    }
    throw error;
  }
}

export async function deleteExpiredMcpOAuthAuthorizations() {
  await db
    .delete(mcpOAuthPendingAuthorizations)
    .where(lt(mcpOAuthPendingAuthorizations.expiresAt, new Date()));
}
