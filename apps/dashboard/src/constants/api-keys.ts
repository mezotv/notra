export const API_KEY_PERMISSIONS = ["api.read", "api.write"] as const;

export const API_KEY_GRANULAR_READ_PERMISSIONS = [
  "posts.read",
  "brand-identities.read",
  "integrations.read",
  "schedules.read",
  "event-triggers.read",
  "chats.read",
  "skills.read",
] as const;

export const API_KEY_GRANULAR_WRITE_PERMISSIONS = [
  "posts.write",
  "brand-identities.write",
  "integrations.write",
  "schedules.write",
  "event-triggers.write",
  "chats.write",
  "skills.write",
] as const;

export const API_KEY_GRANULAR_PERMISSIONS = [
  ...API_KEY_GRANULAR_READ_PERMISSIONS,
  ...API_KEY_GRANULAR_WRITE_PERMISSIONS,
] as const;

export const API_KEY_LEGACY_PERMISSIONS = ["api.read", "api.write"] as const;

export const API_KEY_ACCEPTED_PERMISSIONS = [
  ...API_KEY_GRANULAR_PERMISSIONS,
  ...API_KEY_LEGACY_PERMISSIONS,
] as const;

export const API_KEY_DEFAULT_SCOPES = [
  ...API_KEY_GRANULAR_READ_PERMISSIONS,
] as const;

export const API_KEY_SCOPE_LEVEL = {
  none: "none",
  read: "read",
  write: "write",
} as const;

export const API_KEY_SCOPE_RESOURCES = [
  {
    id: "posts",
    label: "Posts",
    description: "Read and manage your posts and drafts",
    readScope: "posts.read",
    writeScope: "posts.write",
  },
  {
    id: "brand-identities",
    label: "Brand identities",
    description: "Read and manage saved brand voices",
    readScope: "brand-identities.read",
    writeScope: "brand-identities.write",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Read and manage connected content sources",
    readScope: "integrations.read",
    writeScope: "integrations.write",
  },
  {
    id: "schedules",
    label: "Schedules",
    description: "Read and manage scheduled content generation",
    readScope: "schedules.read",
    writeScope: "schedules.write",
  },
  {
    id: "event-triggers",
    label: "Event triggers",
    description: "Read and manage event-based content generation",
    readScope: "event-triggers.read",
    writeScope: "event-triggers.write",
  },
  {
    id: "chats",
    label: "Chats",
    description: "Read and manage chat sessions",
    readScope: "chats.read",
    writeScope: "chats.write",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Read and manage your skills",
    readScope: "skills.read",
    writeScope: "skills.write",
  },
] as const;

export const API_KEY_PRESET_IDS = ["mcp", "sdk", "cli"] as const;

export const API_KEY_EXPIRATION_VALUES = [
  "never",
  "7d",
  "30d",
  "60d",
  "90d",
] as const;

export const API_KEY_EXPIRATION_OPTIONS = [
  { label: "No expiry", value: "never" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "60 days", value: "60d" },
  { label: "90 days", value: "90d" },
] as const;

export const API_KEY_PERMISSION_LABELS = {
  "api.read": "Read only",
  "api.write": "Read & write",
} as const;

export const API_KEY_PERMISSION_SUMMARY = {
  none: "No access",
  read: "Read only",
  write: "Read & write",
  custom: "Custom",
} as const;

export const API_KEY_SCOPE_LEVEL_LABELS = {
  none: "None",
  read: "Read",
  write: "Write",
} as const;

export const API_KEY_EXPIRATION_MS = {
  never: null,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "60d": 60 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
} as const;
