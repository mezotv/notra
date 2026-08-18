import { db } from "@notra/db/drizzle";
import { googleSearchConsoleIntegrations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import { deleteQstashSchedule } from "../qstash/triggers";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export const GSC_OAUTH_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GSC_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GSC_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const GSC_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";
export const GSC_SITES_URL = "https://www.googleapis.com/webmasters/v3/sites";
export const GSC_SEARCH_ANALYTICS_BASE_URL =
  "https://searchconsole.googleapis.com/webmasters/v3/sites";
export const GSC_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "openid",
  "email",
] as const;

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;
const MS_PER_SECOND = 1000;
const MS_PER_DAY = 86_400_000;
const GSC_DATA_LAG_DAYS = 3;
const GSC_MAX_ROW_LIMIT = 25_000;
const REAUTH_ERROR_CODES = new Set([
  "invalid_grant",
  "invalid_client",
  "unauthorized_client",
]);

function getDedicatedGscOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET?.trim();
  if (!(clientId && clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

/**
 * True when Search Console uses its own OAuth client. When it falls back to the
 * shared GOOGLE_CLIENT_ID (also used for sign-in), revoking a token would revoke
 * the user's whole Google grant for this app, so callers must not revoke.
 */
export function hasDedicatedGscOAuthClient(): boolean {
  return getDedicatedGscOAuthCredentials() !== null;
}

export function getGscOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const dedicated = getDedicatedGscOAuthCredentials();
  if (dedicated) {
    return dedicated;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!(clientId && clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

export const gscTokenResponseSchema = z.looseObject({
  access_token: z.string().min(1),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const gscUserInfoSchema = z.looseObject({
  email: z.string().optional(),
});

export const gscSitesResponseSchema = z.looseObject({
  siteEntry: z
    .array(
      z.looseObject({
        siteUrl: z.string().min(1),
        permissionLevel: z.string().optional(),
      })
    )
    .optional(),
});

export const gscSearchAnalyticsResponseSchema = z.looseObject({
  rows: z
    .array(
      z.looseObject({
        keys: z.array(z.string()),
        clicks: z.number(),
        impressions: z.number(),
        ctr: z.number(),
        position: z.number(),
      })
    )
    .optional(),
});

export interface GscSite {
  siteUrl: string;
  permissionLevel: string | null;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export type GscIntegrationRow =
  typeof googleSearchConsoleIntegrations.$inferSelect;

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

function toExpiresAt(expiresInSeconds: number | undefined): Date {
  const seconds = expiresInSeconds ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  return new Date(Date.now() + seconds * MS_PER_SECOND);
}

export async function exchangeGscAuthorizationCode(params: {
  code: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}> {
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

  const parsed = gscTokenResponseSchema.safeParse(await response.json());
  if (!(response.ok && parsed.success)) {
    throw new GscApiError(
      parsed.success && parsed.data.error_description
        ? parsed.data.error_description
        : "Google token exchange failed",
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
  if (!(previous && next)) {
    return false;
  }
  return previous !== next;
}

export async function upsertGscIntegration(params: {
  organizationId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  googleAccountEmail: string | null;
}): Promise<GscIntegrationRow> {
  const existing = await getGscIntegration(params.organizationId);
  const googleAccountChanged = hasGscGoogleAccountChanged(
    existing?.googleAccountEmail,
    params.googleAccountEmail
  );

  const encryptedAccessToken = encryptToken(params.accessToken);
  const encryptedRefreshToken = encryptToken(params.refreshToken);

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
        enabled: true,
        ...(googleAccountChanged
          ? { siteUrl: null, qstashScheduleId: null }
          : {}),
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to save Google Search Console integration");
  }

  if (googleAccountChanged && existing) {
    await revokeGscToken(existing);
    if (existing.qstashScheduleId) {
      try {
        await deleteQstashSchedule(existing.qstashScheduleId);
      } catch (error) {
        console.error("[GSC] Failed to delete QStash schedule:", error);
      }
    }
  }

  return row;
}

export async function updateGscIntegration(
  organizationId: string,
  updates: Partial<
    Pick<
      typeof googleSearchConsoleIntegrations.$inferInsert,
      | "siteUrl"
      | "status"
      | "qstashScheduleId"
      | "lastSyncedAt"
      | "lastError"
      | "enabled"
    >
  >
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

  const parsed = gscTokenResponseSchema.safeParse(await response.json());
  if (!(response.ok && parsed.success)) {
    const errorCode = parsed.success ? parsed.data.error : undefined;
    if (errorCode && REAUTH_ERROR_CODES.has(errorCode)) {
      await updateGscIntegration(integration.organizationId, {
        status: "reauth_required",
        lastError: parsed.data?.error_description ?? errorCode,
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
  return (parsed.data.siteEntry ?? [])
    .filter((entry) => entry.permissionLevel !== "siteUnverifiedUser")
    .map((entry) => ({
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel ?? null,
    }))
    .sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function queryGscTopQueries(
  integration: GscIntegrationRow,
  params: { siteUrl: string; days: number; rowLimit: number }
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

  return (parsed.data.rows ?? [])
    .map((row) => ({
      query: row.keys[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    }))
    .filter((row) => row.query.length > 0);
}
