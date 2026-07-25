import type { ReactNode } from "react";
import {
  TWEET_CASHTAG_REGEX,
  TWEET_MENTION_REGEX,
  TWEET_TOKEN_REGEX,
  TWEET_URL_REGEX,
} from "@/constants/twitter";

const URL_PROTOCOL_REGEX = /^https?:\/\//i;
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

function toSafeExternalUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

function getTweetTokenUrl(token: string): string | undefined {
  if (TWEET_URL_REGEX.test(token)) {
    TWEET_URL_REGEX.lastIndex = 0;
    return toSafeExternalUrl(
      URL_PROTOCOL_REGEX.test(token) ? token : `https://${token}`
    );
  }
  if (TWEET_MENTION_REGEX.test(token)) {
    TWEET_MENTION_REGEX.lastIndex = 0;
    return `https://x.com/${token.slice(1)}`;
  }
  if (TWEET_CASHTAG_REGEX.test(token)) {
    TWEET_CASHTAG_REGEX.lastIndex = 0;
    return `https://x.com/search?q=%24${encodeURIComponent(token.slice(1))}&src=cashtag_click`;
  }
  TWEET_CASHTAG_REGEX.lastIndex = 0;
  TWEET_MENTION_REGEX.lastIndex = 0;
  return `https://x.com/hashtag/${token.slice(1)}`;
}

export function formatTweetContent(content: string): ReactNode[] {
  TWEET_TOKEN_REGEX.lastIndex = 0;
  const parts = content.split(TWEET_TOKEN_REGEX);
  TWEET_TOKEN_REGEX.lastIndex = 0;

  return parts.map((part, i) => {
    TWEET_TOKEN_REGEX.lastIndex = 0;
    if (TWEET_TOKEN_REGEX.test(part)) {
      TWEET_TOKEN_REGEX.lastIndex = 0;
      const href = getTweetTokenUrl(part);
      return (
        <a
          className="cursor-pointer text-sky-500 hover:underline"
          href={href}
          key={`${i}-${part}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
