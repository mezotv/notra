export const TWITTER_CHAR_LIMIT = 280;
export const TWITTER_PREMIUM_CHAR_LIMIT = 25_000;
export const TWEET_URL_WEIGHT = 23;
export const TWEET_LIGHT_CODE_POINT_RANGES: ReadonlyArray<
  readonly [number, number]
> = [
  [0x00_00, 0x10_ff],
  [0x20_00, 0x20_0d],
  [0x20_10, 0x20_1f],
  [0x20_32, 0x20_37],
];
export const TWITTER_BRAND_COLOR = "#000000";
export const TWITTER_DUPLICATE_POST_DOCS_URL =
  "https://developer.x.com/en/support/x-api/error-troubleshooting";

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

export const TWEET_COUNTER_RING_SIZE = 20;
export const TWEET_COUNTER_RING_STROKE = 2;
export const TWEET_COUNTER_RING_RADIUS =
  (TWEET_COUNTER_RING_SIZE - TWEET_COUNTER_RING_STROKE) / 2;
export const TWEET_COUNTER_RING_CIRCUMFERENCE =
  2 * Math.PI * TWEET_COUNTER_RING_RADIUS;
export const TWEET_COUNTER_WARNING_REMAINING = 20;
export const TWEET_COUNTER_WARNING_RATIO = 0.02;
