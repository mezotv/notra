import type {
  GscQueryRow,
  GscSite,
} from "@notra/ai/types/google-search-console";

export interface GscOAuthState {
  organizationId: string;
  userId: string;
  callbackPath: string;
}

export type GscIntegrationStatus = "active" | "reauth_required";

export interface GeoSearchConsoleStatus {
  configured: boolean;
  connected: boolean;
  email: string | null;
  siteUrl: string | null;
  status: GscIntegrationStatus | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  weeklySyncScheduled: boolean;
  sites: GscSite[];
}

export interface GscSelectSiteInput {
  siteUrl: string;
}

export interface GscSyncResult {
  status: "completed" | "skipped" | "invalid_payload";
  keywords?: number;
  suggestionsAdded?: number;
  reason?: string;
}

export interface GscSyncPayload {
  organizationId: string;
}

export interface GscSuggestionGenerationParams {
  companyName: string | null;
  siteUrl: string;
  keywords: GscQueryRow[];
  existingPrompts: string[];
}
