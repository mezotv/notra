export const GITHUB_URL_PATTERNS = [
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^([^/]+)\/([^/]+)$/,
] as const;

export const GITHUB_APP_INSTALL_STATE_KEY_PREFIX = "github_app_install:";

export const GITHUB_APP_INSTALL_STATE_TTL_SECONDS = 600;
