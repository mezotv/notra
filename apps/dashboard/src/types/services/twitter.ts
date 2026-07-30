export interface TwitterTweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
  };
  author_id?: string;
  referenced_tweets?: Array<{ type: string; id: string }>;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

export interface TwitterTimelineResponse {
  data?: TwitterTweet[];
  includes?: { users?: TwitterUser[] };
  meta?: { next_token?: string };
}

export interface TwitterUserLookupResponse {
  data?: { id: string; pinned_tweet_id?: string };
  includes?: { tweets?: TwitterTweet[] };
}

export interface TwitterUserLookup {
  userId: string;
  pinnedTweet: TwitterTweet | null;
}

export type TwitterVerifiedType = "blue" | "business" | "government" | "none";

export interface TwitterVerificationResponse {
  data?: {
    id: string;
    name?: string;
    profile_image_url?: string;
    verified?: boolean;
    verified_type?: TwitterVerifiedType;
  };
}

export interface TwitterVerification {
  name: string | null;
  profileImageUrl: string | null;
  verified: boolean;
  verifiedType: TwitterVerifiedType;
}
