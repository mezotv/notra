import type { VerifiedSessionAuth } from "./auth";

export interface ResolvedSlackInstallation {
  organizationId: string;
  organizationSlug: string | null;
  teamId: string;
  botToken: string;
  allowedChannelIds: string[] | null;
}

export interface InstallationCacheEntry {
  expiresAt: number;
  installation: ResolvedSlackInstallation | null;
}

export interface SlackDashboardRelay {
  channelId: string;
  threadTs: string;
  message: string;
  auth: VerifiedSessionAuth;
}

export interface DraftCompletionState {
  count: number;
  turnId: string;
}

export interface NotraSlackStateExtras {
  notraDraftCompletion?: DraftCompletionState;
  notraPostToXTurnId?: string;
  notraReferenceCompletionTurnId?: string;
}
