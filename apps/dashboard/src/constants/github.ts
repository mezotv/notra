export const GITHUB_URL_PATTERNS = [
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^([^/]+)\/([^/]+)$/,
] as const;

export const GITHUB_INSTALL_STATE_TTL_SECONDS = 1800;

export const GITHUB_OAUTH_SCOPES = [
  "read:user",
  "user:email",
  "read:org",
] as const;

export const GITHUB_CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  install_cancelled: "The GitHub installation was cancelled.",
  invalid_callback:
    "The GitHub callback was missing required parameters. Please try again.",
  expired_state:
    "The GitHub installation link expired. Please try connecting again.",
  session_mismatch:
    "The installation finished under a different login session. Please try again.",
  forbidden: "You do not have access to this organization.",
  github_installation_forbidden:
    "You need to be an admin of the GitHub account that owns this installation.",
  github_reauthorization_required:
    "GitHub needs to be reconnected to authorize organization access.",
  github_callback_failed: "Connecting GitHub failed. Please try again.",
  too_many_requests:
    "Too many GitHub connection attempts. Please wait a moment and try again.",
};

export const GITHUB_APP_PERMISSIONS = [
  "Read repository metadata, branches, and releases",
  "Receive webhook events for the repositories you choose",
  "Access only the repositories you grant during installation",
] as const;
