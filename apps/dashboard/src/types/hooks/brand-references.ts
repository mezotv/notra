export interface BrandReference {
  id: string;
  brandSettingsId: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FetchedTweetResponse {
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
