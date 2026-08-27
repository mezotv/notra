import { db } from "@notra/db/drizzle";
import { googleSearchConsoleIntegrations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

import {
  ACCESS_TOKEN_REFRESH_BUFFER_MS,
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  GSC_DATA_LAG_DAYS,
  GSC_MAX_ROW_LIMIT,
  GSC_OAUTH_REVOKE_URL,
  GSC_OAUTH_TOKEN_URL,
  GSC_SEARCH_ANALYTICS_BASE_URL,
  GSC_SITES_URL,
  GSC_USERINFO_URL,
  MS_PER_DAY,
  REAUTH_ERROR_CODES,
} from "../constants/google-search-console";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import { deleteQstashSchedule } from "../qstash/triggers";
import {
  gscSearchAnalyticsResponseSchema,
  gscSitesResponseSchema,
  gscTokenErrorSchema,
  gscTokenResponseSchema,
  gscUserInfoSchema,
} from "../schemas/google-search-console";
import type {
  ExchangeGscAuthorizationCodeParams,
  ExchangeGscAuthorizationCodeResult,
  GscIntegrationRow,
  GscIntegrationUpdate,
  GscOAuthCredentials,
  GscQueryRow,
  GscSite,
  QueryGscTopQueriesParams,
  UpsertGscIntegrationParams,
} from "../types/google-search-console";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

function credentialsFromEnv(
  clientId: string | undefined,
  clientSecret: string | undefined
): GscOAuthCredentials | null {
  const id = clientId?.trim();
  const secret = clientSecret?.trim();
  if (!(id && secret)) {
    return null;
  }
  return { clientId: id, clientSecret: secret };
}

function getDedicatedGscOAuthCredentials(): GscOAuthCredentials | null {
  return credentialsFromEnv(
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
  );
}

/**
 * True when Search Console uses its own OAuth client. When it falls back to the
 * shared GOOGLE_CLIENT_ID (also used for sign-in), revoking a token would revoke
 * the user's whole Google grant for this app, so callers must not revoke.
 */
export function hasDedicatedGscOAuthClient(): boolean {
  return getDedicatedGscOAuthCredentials() !== null;
}

export function getGscOAuthCredentials(): GscOAuthCredentials | null {
  return (
    getDedicatedGscOAuthCredentials() ??
    credentialsFromEnv(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
  );
}

export class GscReauthRequiredError extends Error {
  constructor(message = "Google Search Console access must be re-authorized") {
    super(message);
    this.name = "GscReauthRequiredError";
  }
}

export class GscApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GscApiError";
    this.status = status;
  }
}

function parseTokenError(payload: unknown): {
  code: string | undefined;
  description: string | undefined;
} {
  const parsed = gscTokenErrorSchema.safeParse(payload);
  return {
    code: parsed.success ? parsed.data.error : undefined,
    description: parsed.success ? parsed.data.error_description : undefined,
  };
}

function toExpiresAt(expiresInSeconds: number | undefined): Date {
  const seconds = expiresInSeconds ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  return new Date(Date.now() + seconds * 1000);
}

export async function exchangeGscAuthorizationCode(
  params: ExchangeGscAuthorizationCodeParams
): Promise<ExchangeGscAuthorizationCodeResult> {
  const credentials = getGscOAuthCredentials();
  if (!credentials) {
    throw new Error("Google OAuth is not configured");
  }

  const response = await fetch(GSC_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code: params.code,
      grant_type: "authorization_code",
      redirect_uri: params.redirectUri,
    }),
  });

  const payload = await response.json();
  const parsed = gscTokenResponseSchema.safeParse(payload);
  if (!(response.ok && parsed.success)) {
    const { code, description } = parseTokenError(payload);
    throw new GscApiError(
      description ?? code ?? "Google token exchange failed",
      response.status
    );
  }

  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token ?? null,
    expiresAt: toExpiresAt(parsed.data.expires_in),
  };
}

export async function fetchGscAccountEmail(
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(GSC_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return null;
    }
    const parsed = gscUserInfoSchema.safeParse(await response.json());
    return parsed.success ? (parsed.data.email ?? null) : null;
  } catch {
    return null;
  }
}

export async function getGscIntegration(
  organizationId: string
): Promise<GscIntegrationRow | null> {
  const row = await db.query.googleSearchConsoleIntegrations.findFirst({
    where: eq(googleSearchConsoleIntegrations.organizationId, organizationId),
  });
  return row ?? null;
}

export function hasGscGoogleAccountChanged(
  previousEmail: string | null | undefined,
  nextEmail: string | null
): boolean {
  const previous = previousEmail?.trim().toLowerCase();
  const next = nextEmail?.trim().toLowerCase();
  // Userinfo can fail, return malformed JSON, or omit email. If we cannot
  // confirm the next identity, treat the account as changed so reconnect
  // never keeps the previous property or weekly schedule under new tokens.
  if (!next) {
    return true;
  }
  if (!previous) {
    return false;
  }
  return previous !== next;
}

export function shouldClearGscSiteOnReconnect(
  existing: Pick<GscIntegrationRow, "googleAccountEmail" | "siteUrl"> | null,
  nextEmail: string | null
): boolean {
  if (!existing) {
    return false;
  }
  if (hasGscGoogleAccountChanged(existing.googleAccountEmail, nextEmail)) {
    return true;
  }
  // A selected property with no stored email cannot be proven to belong to
  // the account that just signed in.
  return Boolean(existing.siteUrl && !existing.googleAccountEmail?.trim());
}

export async function upsertGscIntegration(
  params: UpsertGscIntegrationParams
): Promise<GscIntegrationRow> {
  const existing = await getGscIntegration(params.organizationId);
  const googleAccountChanged = shouldClearGscSiteOnReconnect(
    existing,
    params.googleAccountEmail
  );

  const encryptedAccessToken = encryptToken(params.accessToken);
  const encryptedRefreshToken = encryptToken(params.refreshToken);

  // Tear the old account's schedule down before the upsert clears its id: if
  // QStash deletion fails, keeping the (deterministic, per-organization) id on
  // the row lets the next site selection reuse or replace the schedule instead
  // of orphaning one that keeps firing.
  let oldScheduleDeleted = true;
  if (googleAccountChanged && existing) {
    await revokeGscToken(existing);
    if (existing.qstashScheduleId) {
      try {
        await deleteQstashSchedule(existing.qstashScheduleId);
      } catch (error) {
        console.error("[GSC] Failed to delete QStash schedule:", error);
        oldScheduleDeleted = false;
      }
    }
  }

  const [row] = await db
    .insert(googleSearchConsoleIntegrations)
    .values({
      id: `gsc_${nanoid()}`,
      organizationId: params.organizationId,
      createdByUserId: params.userId,
      googleAccountEmail: params.googleAccountEmail,
      encryptedAccessToken,
      encryptedRefreshToken,
      accessTokenExpiresAt: params.expiresAt,
      status: "active",
      lastError: null,
    })
    .onConflictDoUpdate({
      target: googleSearchConsoleIntegrations.organizationId,
      set: {
        createdByUserId: params.userId,
        googleAccountEmail: params.googleAccountEmail,
        encryptedAccessToken,
        encryptedRefreshToken,
        accessTokenExpiresAt: params.expiresAt,
        status: "active",
        lastError: null,
        ...(googleAccountChanged
          ? {
              siteUrl: null,
              ...(oldScheduleDeleted ? { qstashScheduleId: null } : {}),
            }
          : {}),
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to save Google Search Console integration");
  }

  return row;
}

export async function updateGscIntegration(
  organizationId: string,
  updates: GscIntegrationUpdate
): Promise<GscIntegrationRow | null> {
  const [row] = await db
    .update(googleSearchConsoleIntegrations)
    .set(updates)
    .where(eq(googleSearchConsoleIntegrations.organizationId, organizationId))
    .returning();
  return row ?? null;
}

export async function deleteGscIntegration(
  organizationId: string
): Promise<GscIntegrationRow | null> {
  const [row] = await db
    .delete(googleSearchConsoleIntegrations)
    .where(eq(googleSearchConsoleIntegrations.organizationId, organizationId))
    .returning();
  return row ?? null;
}

export async function revokeGscToken(integration: GscIntegrationRow) {
  if (!hasDedicatedGscOAuthClient()) {
    // Shared sign-in client: revoking would also revoke the user's Google login grant.
    return;
  }
  try {
    const refreshToken = decryptToken(integration.encryptedRefreshToken);
    await fetch(GSC_OAUTH_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refreshToken }),
    });
  } catch (error) {
    console.error("[GSC] Failed to revoke Google token:", error);
  }
}

async function refreshGscAccessToken(
  integration: GscIntegrationRow
): Promise<string> {
  const credentials = getGscOAuthCredentials();
  if (!credentials) {
    throw new Error("Google OAuth is not configured");
  }

  const refreshToken = decryptToken(integration.encryptedRefreshToken);
  const response = await fetch(GSC_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await response.json();
  const parsed = gscTokenResponseSchema.safeParse(payload);
  if (!(response.ok && parsed.success)) {
    const { code, description } = parseTokenError(payload);
    if (code && REAUTH_ERROR_CODES.has(code)) {
      await updateGscIntegration(integration.organizationId, {
        status: "reauth_required",
        lastError: description ?? code,
      });
      throw new GscReauthRequiredError();
    }
    throw new GscApiError(
      "Failed to refresh Google access token",
      response.status
    );
  }

  const accessToken = parsed.data.access_token;
  await db
    .update(googleSearchConsoleIntegrations)
    .set({
      encryptedAccessToken: encryptToken(accessToken),
      accessTokenExpiresAt: toExpiresAt(parsed.data.expires_in),
      status: "active",
      lastError: null,
    })
    .where(eq(googleSearchConsoleIntegrations.id, integration.id));

  return accessToken;
}

export async function getGscAccessToken(
  integration: GscIntegrationRow
): Promise<string> {
  if (integration.status === "reauth_required") {
    throw new GscReauthRequiredError();
  }
  const expiresSoon =
    integration.accessTokenExpiresAt.getTime() -
      ACCESS_TOKEN_REFRESH_BUFFER_MS <
    Date.now();
  if (!expiresSoon) {
    return decryptToken(integration.encryptedAccessToken);
  }
  return await refreshGscAccessToken(integration);
}

async function gscFetch(
  integration: GscIntegrationRow,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const accessToken = await getGscAccessToken(integration);
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status === 401) {
    const refreshed = await refreshGscAccessToken(integration);
    return await fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${refreshed}`,
      },
    });
  }
  return response;
}

export async function listGscSites(
  integration: GscIntegrationRow
): Promise<GscSite[]> {
  const response = await gscFetch(integration, GSC_SITES_URL);
  if (!response.ok) {
    throw new GscApiError(
      "Failed to list Search Console properties",
      response.status
    );
  }
  const parsed = gscSitesResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new GscApiError("Unexpected Search Console response", 502);
  }
  const sites = (parsed.data.siteEntry ?? []).flatMap((entry) => {
    if (entry.permissionLevel === "siteUnverifiedUser") {
      return [];
    }
    return {
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel ?? null,
    };
  });
  return sites.sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function queryGscTopQueries(
  integration: GscIntegrationRow,
  params: QueryGscTopQueriesParams
): Promise<GscQueryRow[]> {
  const endDate = new Date(Date.now() - GSC_DATA_LAG_DAYS * MS_PER_DAY);
  const startDate = new Date(endDate.getTime() - params.days * MS_PER_DAY);
  const url = `${GSC_SEARCH_ANALYTICS_BASE_URL}/${encodeURIComponent(params.siteUrl)}/searchAnalytics/query`;

  const response = await gscFetch(integration, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
      dimensions: ["query"],
      type: "web",
      rowLimit: Math.min(params.rowLimit, GSC_MAX_ROW_LIMIT),
    }),
  });

  if (!response.ok) {
    throw new GscApiError(
      "Failed to query Search Console analytics",
      response.status
    );
  }
  const parsed = gscSearchAnalyticsResponseSchema.safeParse(
    await response.json()
  );
  if (!parsed.success) {
    throw new GscApiError("Unexpected Search Console response", 502);
  }

  return (parsed.data.rows ?? []).flatMap((row) => {
    const query = row.keys[0] ?? "";
    if (query.length === 0) {
      return [];
    }
    return {
      query,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    };
  });
}
