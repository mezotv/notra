import {
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
