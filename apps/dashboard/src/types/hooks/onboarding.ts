export interface OnboardingStatus {
  hasBrandIdentity: boolean;
  hasIntegration: boolean;
  hasSchedule: boolean;
  onboardingCompleted: boolean;
  onboardingDismissed: boolean;
}

export interface UseOnboardingStatusOptions {
  refetchInterval?: number | false;
}

export interface UseOnboardingSuggestionsOptions {
  agentRunning?: boolean;
}

export interface OnboardingRunSnapshot {
  organizationId: string;
  running: boolean;
}

export interface PendingOnboardingSuggestion {
  organizationId: string;
  suggestionId: string;
}
