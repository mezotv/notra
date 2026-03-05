export const TWITTER_CHAR_LIMIT = 280;
export const MAX_IMPORT_POSTS = 20;
export const TWITTER_BRAND_COLOR = "#000000";

const TWITTER_PROFILE_IMAGE_SIZE_REGEX =
  /_(normal|bigger|mini|200x200|400x400)\./;

export function normalizeTwitterProfileImageUrl(url: string): string {
  return url.replace(TWITTER_PROFILE_IMAGE_SIZE_REGEX, ".");
}
