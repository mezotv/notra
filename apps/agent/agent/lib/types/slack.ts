export interface DraftCompletionState {
  count: number;
  turnId: string;
}

export interface NotraSlackStateExtras {
  notraDraftCompletion?: DraftCompletionState;
  notraPostToXTurnId?: string;
  notraReferenceCompletionTurnId?: string;
}
