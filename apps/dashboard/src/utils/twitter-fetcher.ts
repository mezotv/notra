import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";

interface TweetData {
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
