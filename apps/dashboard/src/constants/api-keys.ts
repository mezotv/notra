export const API_KEY_PERMISSIONS = ["api.read", "api.write"] as const;

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

export const API_KEY_EXPIRATION_MS = {
  never: null,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "60d": 60 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
} as const;
