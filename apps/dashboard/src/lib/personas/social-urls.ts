import type { PersonaSocialPlatform } from "@/types/personas";

const PROFILE_URL_BUILDERS: Record<
  PersonaSocialPlatform,
  (username: string) => string
> = {
  twitter: (username) => `https://x.com/${encodeURIComponent(username)}`,
  linkedin: (username) =>
    `https://www.linkedin.com/in/${encodeURIComponent(username)}`,
  github: (username) => `https://github.com/${encodeURIComponent(username)}`,
  instagram: (username) =>
    `https://www.instagram.com/${encodeURIComponent(username)}`,
  youtube: (username) =>
    `https://www.youtube.com/@${encodeURIComponent(username)}`,
  tiktok: (username) =>
    `https://www.tiktok.com/@${encodeURIComponent(username)}`,
  website: (username) =>
    username.startsWith("http://") || username.startsWith("https://")
      ? username
      : `https://${username}`,
};

function sanitizeProfileUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function getPersonaSocialProfileUrl(
  platform: PersonaSocialPlatform,
  username: string
): string | null {
  return sanitizeProfileUrl(PROFILE_URL_BUILDERS[platform](username));
}
