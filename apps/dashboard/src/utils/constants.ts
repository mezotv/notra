export const LAST_VISITED_ORGANIZATION_COOKIE = "notra_last_organization";

export const GITHUB_URL_PATTERNS = [
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^([^/]+)\/([^/]+)$/,
] as const;

export const RESERVED_ORGANIZATION_SLUGS = [
  "api",
  "auth",
  "login",
  "signup",
  "onboarding",
  "dashboard",
  "settings",
  "admin",
  "help",
  "support",
  "docs",
  "blog",
  "about",
  "terms",
  "privacy",
  "contact",
] as const;

export const FEATURES = {
  TEAM_MEMBERS: "team_members",
  AI_CREDITS: "ai_credits",
  WORKFLOWS: "workflows",
  INTEGRATIONS: "integrations",
  LOG_RETENTION_7_DAYS: "log_retention_7_days",
  LOG_RETENTION_30_DAYS: "log_retention_30_days",
} as const;

export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES];

export const ALLOWED_RASTER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_RASTER_MIME_TYPES,
  "image/svg+xml",
] as const;

export type AllowedRasterMimeType = (typeof ALLOWED_RASTER_MIME_TYPES)[number];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_CONTENT_FILE_SIZE = 250 * 1024 * 1024;

export const CONTENT_LIMIT = 20;
