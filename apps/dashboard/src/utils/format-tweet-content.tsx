import type { ReactNode } from "react";
import {
  TWEET_MENTION_REGEX,
  TWEET_TOKEN_REGEX,
  TWEET_URL_REGEX,
} from "@/constants/twitter";

function getTweetTokenUrl(token: string): string | undefined {
  if (TWEET_URL_REGEX.test(token)) {
    TWEET_URL_REGEX.lastIndex = 0;
    return token;
  }
  if (TWEET_MENTION_REGEX.test(token)) {
    TWEET_MENTION_REGEX.lastIndex = 0;
    return `https://x.com/${token.slice(1)}`;
  }
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
