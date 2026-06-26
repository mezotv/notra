export const GITHUB_URL_PATTERNS = [
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^([^/]+)\/([^/]+)$/,
] as const;

export const GITHUB_INSTALL_MESSAGE = "notra:github-installed";
export const GITHUB_INSTALL_CHANNEL = "notra:github-install";

export const GITHUB_INSTALL_STATE_TTL_SECONDS = 600;

export const GITHUB_APP_PERMISSIONS = [
  "Read repository metadata, branches, and releases",
  "Receive webhook events for the repositories you choose",
  "Access only the repositories you grant during installation",
] as const;
