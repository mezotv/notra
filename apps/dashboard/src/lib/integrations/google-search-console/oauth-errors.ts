const OAUTH_ERROR_BY_STATUS = new Map<number, string>([
  [401, "gsc_session_expired"],
  [403, "gsc_forbidden"],
]);

export const GSC_ERROR_MESSAGES: Record<string, string> = {
  gsc_not_configured:
    "Google Search Console is not available on this workspace yet.",
  gsc_access_denied: "Google access was denied. Nothing was connected.",
  gsc_missing_refresh_token:
    "Google did not grant offline access. Please try connecting again.",
  gsc_token_exchange_failed: "Google sign-in failed. Please try again.",
  gsc_auth_failed: "Failed to connect Google Search Console.",
  gsc_disconnect_in_progress:
    "Google Search Console is still disconnecting. Please try again shortly.",
  gsc_expired_state: "The connection request expired. Please try again.",
  gsc_session_mismatch: "Please sign in again before connecting.",
  gsc_rate_limited: "Too many connection attempts. Please wait a moment.",
  gsc_session_expired: "Your session expired. Sign in and try again.",
  gsc_forbidden: "You do not have access to this organization.",
  gsc_invalid_callback:
    "Google returned an invalid response. Please try again.",
};

export function gscOAuthErrorParam(
  status: number,
  fallback = "gsc_auth_failed"
): string {
  return OAUTH_ERROR_BY_STATUS.get(status) ?? fallback;
}
