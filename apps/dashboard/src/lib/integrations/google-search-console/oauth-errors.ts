const GSC_OAUTH_ERROR_BY_STATUS = new Map<number, string>([
  [401, "gsc_session_expired"],
  [403, "gsc_forbidden"],
]);

export function gscOAuthErrorParam(
  status: number,
  fallback = "gsc_auth_failed"
): string {
  return GSC_OAUTH_ERROR_BY_STATUS.get(status) ?? fallback;
}
