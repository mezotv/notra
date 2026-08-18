import type { googleSearchConsoleIntegrations } from "@notra/db/schema";

export interface GscOAuthCredentials {
  clientId: string;
  clientSecret: string;
}

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

export type GscIntegrationUpdate = Partial<
  Pick<
    typeof googleSearchConsoleIntegrations.$inferInsert,
    "siteUrl" | "status" | "qstashScheduleId" | "lastSyncedAt" | "lastError"
  >
>;

export interface ExchangeGscAuthorizationCodeParams {
  code: string;
  redirectUri: string;
}

export interface ExchangeGscAuthorizationCodeResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

export interface UpsertGscIntegrationParams {
  organizationId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  googleAccountEmail: string | null;
}

export interface QueryGscTopQueriesParams {
  siteUrl: string;
  days: number;
  rowLimit: number;
}
