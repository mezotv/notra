import * as z from "zod";

export const API_KEY_PERMISSIONS = ["api.read", "api.write"] as const;
export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export const API_KEY_EXPIRATION_OPTIONS = [
  { label: "No expiry", value: "never" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "60 days", value: "60d" },
  { label: "90 days", value: "90d" },
] as const;

export type ApiKeyExpiration =
  (typeof API_KEY_EXPIRATION_OPTIONS)[number]["value"];

export const EXPIRATION_MS: Record<ApiKeyExpiration, number | null> = {
  never: null,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "60d": 60 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  permission: z.enum(API_KEY_PERMISSIONS),
  expiration: z.enum(["never", "7d", "30d", "60d", "90d"]),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
