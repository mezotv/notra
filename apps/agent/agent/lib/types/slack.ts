export interface ChannelVisibilityCacheEntry {
  expiresAt: number;
  isPublic: boolean;
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
