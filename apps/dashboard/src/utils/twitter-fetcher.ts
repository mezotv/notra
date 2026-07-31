import { Data, Effect } from "effect";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import type {
  TwitterUserLookup,
  TwitterUserLookupResponse,
  TwitterVerification,
  TwitterVerificationResponse,
} from "@/types/services/twitter";

export class TwitterApiError extends Data.TaggedError("TwitterApiError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface TweetData {
  tweetId: string;
  content: string;
  authorHandle: string;
  authorName: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  profileImageUrl: string | null;
  createdAt: string;
}

const TWEET_URL_REGEX =
  /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;

export function parseTweetId(url: string): string | null {
  const match = url.match(TWEET_URL_REGEX);
  return match?.[2] ?? null;
}

export async function twitterAppFetch(url: string): Promise<Response> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error("Twitter API is not configured");
  }

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

export const fetchTwitterUserWithPinnedTweet = Effect.fn(
  "fetchTwitterUserWithPinnedTweet"
)(function* (username: string) {
  const params = new URLSearchParams({
    "user.fields": "pinned_tweet_id",
    expansions: "pinned_tweet_id",
    "tweet.fields":
      "text,created_at,public_metrics,author_id,referenced_tweets",
  });

  const response = yield* Effect.tryPromise({
    try: () =>
      twitterAppFetch(
        `https://api.x.com/2/users/by/username/${encodeURIComponent(username)}?${params.toString()}`
      ),
    catch: (cause) =>
      new TwitterApiError({ message: "Failed to fetch X profile", cause }),
  });

  if (!response.ok) {
    return null;
  }

  const json = yield* Effect.tryPromise({
    try: (): Promise<TwitterUserLookupResponse> => response.json(),
    catch: (cause) =>
      new TwitterApiError({
        message: "Failed to parse X profile response",
        cause,
      }),
  });

  if (!json.data?.id) {
    return null;
  }

  const lookup: TwitterUserLookup = {
    userId: json.data.id,
    pinnedTweet: json.includes?.tweets?.[0] ?? null,
  };
  return lookup;
});

export const fetchTwitterVerification = Effect.fn("fetchTwitterVerification")(
  function* (username: string) {
    const params = new URLSearchParams({
      "user.fields": "verified,verified_type,profile_image_url",
    });

    const response = yield* Effect.tryPromise({
      try: () =>
        twitterAppFetch(
          `https://api.x.com/2/users/by/username/${encodeURIComponent(username)}?${params.toString()}`
        ),
      catch: (cause) =>
        new TwitterApiError({
          message: "Failed to fetch X verification status",
          cause,
        }),
    });

    if (!response.ok) {
      return null;
    }

    const json = yield* Effect.tryPromise({
      try: (): Promise<TwitterVerificationResponse> => response.json(),
      catch: (cause) =>
        new TwitterApiError({
          message: "Failed to parse X verification response",
          cause,
        }),
    });

    if (!json.data?.id) {
      return null;
    }

    const verifiedType = json.data.verified_type ?? "none";
    const verification: TwitterVerification = {
      name: json.data.name ?? null,
      profileImageUrl: json.data.profile_image_url
        ? normalizeTwitterProfileImageUrl(json.data.profile_image_url)
        : null,
      verified: json.data.verified === true || verifiedType !== "none",
      verifiedType,
    };
    return verification;
  }
);

export async function fetchTweet(tweetUrl: string): Promise<TweetData> {
  const tweetId = parseTweetId(tweetUrl);
  if (!tweetId) {
    throw new Error("Invalid tweet URL");
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error("Twitter API is not configured");
  }

  const params = new URLSearchParams({
    "tweet.fields": "text,public_metrics,created_at,author_id",
    expansions: "author_id",
    "user.fields": "username,name,profile_image_url",
  });

  const res = await fetch(
    `https://api.x.com/2/tweets/${tweetId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail || error?.title || "Failed to fetch tweet");
  }

  const json = await res.json();
  const tweet = json.data;
  const author =
    json.includes?.users?.find(
      (u: { id: string }) => u.id === tweet.author_id
    ) ?? json.includes?.users?.[0];

  if (!tweet) {
    throw new Error("Tweet not found");
  }

  const authorHandle = author?.username ?? "unknown";

  return {
    tweetId,
    content: tweet.text,
    authorHandle,
    authorName: author?.name ?? authorHandle,
    url: `https://x.com/${authorHandle}/status/${tweetId}`,
    likes: tweet.public_metrics?.like_count ?? 0,
    retweets: tweet.public_metrics?.retweet_count ?? 0,
    replies: tweet.public_metrics?.reply_count ?? 0,
    profileImageUrl: author?.profile_image_url
      ? normalizeTwitterProfileImageUrl(author.profile_image_url)
      : null,
    createdAt: tweet.created_at ?? new Date().toISOString(),
  };
}
