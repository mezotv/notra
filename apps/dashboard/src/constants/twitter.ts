export const TWITTER_CHAR_LIMIT = 280;
export const MAX_IMPORT_POSTS = 20;
export const TWITTER_BRAND_COLOR = "#000000";

export const TWEET_MENTION_REGEX = /(?<![\w.])@(\w{1,15})/g;
export const TWEET_HASHTAG_REGEX = /#(\w+)/g;
export const TWEET_CASHTAG_REGEX =
  /(?<![\w$])\$([A-Za-z]{1,6}(?:[._][A-Za-z]{1,2})?)/g;
export const TWEET_URL_REGEX =
  /(?:https?:\/\/[^\s<]*[^\s<.,:;"')\]!?]|(?<![@\w.-])(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})(?:\/[^\s<]*[^\s<.,:;"')\]!?])?)/g;
export const TWEET_TOKEN_REGEX =
  /((?<![\w.])@\w{1,15}|#\w+|(?<![\w$])\$[A-Za-z]{1,6}(?:[._][A-Za-z]{1,2})?|(?:https?:\/\/[^\s<]*[^\s<.,:;"')\]!?]|(?<![@\w.-])(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})(?:\/[^\s<]*[^\s<.,:;"')\]!?])?))/g;

const TWITTER_PROFILE_IMAGE_SIZE_REGEX =
  /_(normal|bigger|mini|200x200|400x400)\./;

export function normalizeTwitterProfileImageUrl(url: string): string {
  return url.replace(TWITTER_PROFILE_IMAGE_SIZE_REGEX, ".");
}
