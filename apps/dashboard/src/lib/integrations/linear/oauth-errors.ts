const LINEAR_OAUTH_ERROR_BY_STATUS = new Map<number, string>([
  [401, "not_authenticated"],
  [403, "forbidden"],
]);

export function linearOAuthErrorParam(
  status: number,
  fallback = "linear_auth_failed"
): string {
  return LINEAR_OAUTH_ERROR_BY_STATUS.get(status) ?? fallback;
}
