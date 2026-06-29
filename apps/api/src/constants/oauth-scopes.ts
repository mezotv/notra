export const PUBLIC_API_SCOPES = [
  "posts.read",
  "posts.write",
  "brand-identities.read",
  "brand-identities.write",
  "integrations.read",
  "integrations.write",
  "schedules.read",
  "schedules.write",
  "chats.read",
  "chats.write",
  "skills.read",
  "skills.write",
] as const;

export const LEGACY_API_READ_SCOPE = "api.read";
export const LEGACY_API_WRITE_SCOPE = "api.write";
