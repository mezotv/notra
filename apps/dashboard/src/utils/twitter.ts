import {
  TWEET_LIGHT_CODE_POINT_RANGES,
  TWEET_URL_REGEX,
  TWEET_URL_WEIGHT,
  TWITTER_CHAR_LIMIT,
  TWITTER_PREMIUM_CHAR_LIMIT,
} from "@/constants/twitter";
import type { TwitterPostAuthor } from "@/types/content/twitter-post";
import type { ConnectedAccount } from "@/types/hooks/connected-accounts";

export function twitterAuthorFromAccount(
  account: ConnectedAccount
): TwitterPostAuthor {
  return {
    name: account.displayName,
    handle: account.username,
    avatar: account.profileImageUrl ?? undefined,
    verified: account.verified,
    verifiedType: account.verifiedType,
  };
}

export function getTwitterCharLimit(
  verifiedType: string | null | undefined
): number {
  if (verifiedType === "blue" || verifiedType === "business") {
    return TWITTER_PREMIUM_CHAR_LIMIT;
  }
  return TWITTER_CHAR_LIMIT;
}

export function isSquareTwitterAvatar(
  verifiedType: string | null | undefined
): boolean {
  return verifiedType === "business" || verifiedType === "government";
}

export function createTwitterPostUrl(text: string): string {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", text.trim());

  return url.toString();
}

const HEAVY_CHARACTER_WEIGHT = 2;
const graphemeSegmenter = new Intl.Segmenter();

function getGraphemeWeight(grapheme: string): number {
  const codePoints = [...grapheme];
  if (codePoints.length > 1) {
    return HEAVY_CHARACTER_WEIGHT;
  }
  const codePoint = codePoints[0]?.codePointAt(0) ?? 0;
  const isLight = TWEET_LIGHT_CODE_POINT_RANGES.some(
    ([start, end]) => codePoint >= start && codePoint <= end
  );
  return isLight ? 1 : HEAVY_CHARACTER_WEIGHT;
}

export function getWeightedTweetLength(text: string): number {
  TWEET_URL_REGEX.lastIndex = 0;
  let length = 0;
  const withoutUrls = text.replace(TWEET_URL_REGEX, () => {
    length += TWEET_URL_WEIGHT;
    return "";
  });
  for (const { segment } of graphemeSegmenter.segment(withoutUrls)) {
    length += getGraphemeWeight(segment);
  }
  return length;
}
