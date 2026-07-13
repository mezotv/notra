export const TWITTER_API_BASE = "https://api.x.com/2";
export const RECENT_TWEETS_MIN_COUNT = 25;
export const RECENT_TWEETS_DEFAULT_COUNT = RECENT_TWEETS_MIN_COUNT;
export const RECENT_TWEETS_MAX_COUNT = 50;
export const HANDLE_PREFIX_REGEX = /^@/;
export const TWITTER_WWW_PREFIX_PATTERN = /^www\./;
export const PUBLIC_TWEET_SEARCH_QUERY_TOKEN = "{username}";
export const PUBLIC_TWEET_SEARCH_QUERY_TEMPLATES = [
  "site:x.com/{username}/status",
  "site:twitter.com/{username}/status",
  '"@{username}" site:x.com status',
];
export const PUBLIC_TWEET_TEXT_MAX_LENGTH = 25_000;
export const PUBLIC_TWEET_TEXT_MIN_LENGTH = 2;
export const TWITTER_STATUS_ID_REGEX = /^\d+$/;
export const TWITTER_MARKDOWN_POST_HEADING = "## Post";
export const TWITTER_MARKDOWN_AUTHOR_REGEX =
  /\n\n\[([^\]]+)\]\(https:\/\/x\.com\/[^/)]+\)\n\n\[@([^\]]+)\]\(https:\/\/x\.com\/[^/)]+\)\n\n/;
export const TWITTER_MARKDOWN_ESCAPE_REGEX = /\\([\\_*[\]()~`>#+\-.!])/g;
export const TWITTER_MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\([^)]+\)/g;
export const TWITTER_MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\([^)]+\)/g;
export const TWITTER_MARKDOWN_NEWLINES_REGEX = /\n{3,}/g;
export const TWITTER_MARKDOWN_QUOTE_REGEX =
  /\n\n\[[^\]]+\]\(https:\/\/x\.com\/[^/)]+\)\n\n\[@[^\]]+\]\(https:\/\/x\.com\/[^/)]+\)\n\n/;
export const TWITTER_MARKDOWN_TIME_REGEX = /^\d{1,2}:\d{2}$/gm;
