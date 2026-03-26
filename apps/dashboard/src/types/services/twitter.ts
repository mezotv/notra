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
