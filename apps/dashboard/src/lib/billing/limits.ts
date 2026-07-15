import { TEAM_MEMBER_LIMIT_ERROR_MESSAGE } from "@notra/ai/constants/billing-limits";

export const TEAM_MEMBER_LIMIT_TOAST_MESSAGE =
  "Team member limit reached on your current plan.";

function normalizeErrorMessage(errorMessage: string) {
  return errorMessage.trim().toLowerCase();
}

export function isTeamMemberLimitError(errorMessage?: string | null): boolean {
  if (!errorMessage) {
    return false;
  }

  const normalized = normalizeErrorMessage(errorMessage);

  return (
    normalized === normalizeErrorMessage(TEAM_MEMBER_LIMIT_ERROR_MESSAGE) ||
    normalized === normalizeErrorMessage(TEAM_MEMBER_LIMIT_TOAST_MESSAGE)
  );
}

export function mapBillingLimitErrorMessage(
  errorMessage?: string | null,
  fallback = "Action failed"
): string {
  if (isTeamMemberLimitError(errorMessage)) {
    return TEAM_MEMBER_LIMIT_TOAST_MESSAGE;
  }

  if (!errorMessage || errorMessage.trim().length === 0) {
    return fallback;
  }

  return errorMessage;
}
