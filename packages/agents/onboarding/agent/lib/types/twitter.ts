export interface RecentTweet {
  id: string;
  text: string;
  createdAt: string | null;
  likes: number | null;
  retweets: number | null;
  replies: number | null;
  url: string;
}

export interface RecentTweetsResult {
  handle: string;
  name: string;
  bio: string | null;
  followers: number | null;
  source: "public_web" | "x_api";
  tweets: RecentTweet[];
}
