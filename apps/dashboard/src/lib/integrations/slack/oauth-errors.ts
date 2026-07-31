const SLACK_OAUTH_ERROR_BY_STATUS = new Map<number, string>([
  [401, "not_authenticated"],
  [403, "forbidden"],
]);

export function slackOAuthErrorParam(
  status: number,
  fallback = "slack_auth_failed"
): string {
  return SLACK_OAUTH_ERROR_BY_STATUS.get(status) ?? fallback;
}
