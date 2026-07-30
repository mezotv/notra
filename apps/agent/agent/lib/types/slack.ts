import type { appendChatMessageIfMissing } from "@notra/ai/chat/history";
import type { VerifiedSessionAuth } from "./auth";

export type MirrorUiMessage = Parameters<typeof appendChatMessageIfMissing>[2];

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
