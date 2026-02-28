const TEAM_MEMBER_LIMIT_MATCHERS = [
  "team member limit",
  "invite more members",
  "team_members",
];

export const TEAM_MEMBER_LIMIT_TOAST_MESSAGE =
  "Team member limit reached on your current plan.";

export function isTeamMemberLimitError(errorMessage?: string | null): boolean {
  if (!errorMessage) {
    return false;
  }

  const normalized = errorMessage.toLowerCase();
  return TEAM_MEMBER_LIMIT_MATCHERS.some((matcher) =>
    normalized.includes(matcher)
  );
}

export function mapInviteLimitErrorMessage(
  errorMessage?: string | null,
  fallback = "Failed to send invitation"
): string {
  if (isTeamMemberLimitError(errorMessage)) {
    return TEAM_MEMBER_LIMIT_TOAST_MESSAGE;
  }

  if (!errorMessage || errorMessage.trim().length === 0) {
    return fallback;
  }

  return errorMessage;
}
