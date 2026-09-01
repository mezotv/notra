import { defineTool } from "eve/tools";

import { HANDLE_PREFIX_REGEX, TWITTER_API_BASE } from "../constants/twitter";
import { recentTweetsInputSchema } from "../schemas/research-tools";
import {
  twitterTimelineSchema,
  twitterUserLookupSchema,
} from "../schemas/twitter";
import { fetchWithTransientRetry } from "../utils/retry";
import { fetchPublicRecentTweets, getTwitterHeaders } from "../utils/twitter";

export function createFetchRecentTweetsTool() {
  return defineTool({
    description:
      "Fetch 25 to 50 recent original company tweets by handle. Uses the X API when configured and public Context.dev web research otherwise.",
    inputSchema: recentTweetsInputSchema,
    async execute({ handle, count }) {
      const headers = getTwitterHeaders();
      const username = handle.replace(HANDLE_PREFIX_REGEX, "");
      if (!headers) {
        return await fetchPublicRecentTweets(username, count);
      }

      const userResponse = await fetchWithTransientRetry(
        `${TWITTER_API_BASE}/users/by/username/${encodeURIComponent(username)}?user.fields=description,public_metrics`,
        { headers },
        `X user lookup for ${username}`
      );
      if (!userResponse.ok) {
        throw new Error(
          `X API user lookup for ${username} failed with status ${userResponse.status}`
        );
      }
      const user = twitterUserLookupSchema.parse(await userResponse.json());
      const account = user.data;
      if (!account) {
        throw new Error(`X account @${username} was not found or is suspended`);
      }

      const timelineParams = new URLSearchParams({
        max_results: String(count),
        exclude: "replies,retweets",
        "tweet.fields": "text,public_metrics,created_at",
      });
      const timelineResponse = await fetchWithTransientRetry(
        `${TWITTER_API_BASE}/users/${account.id}/tweets?${timelineParams.toString()}`,
        { headers },
        `X timeline lookup for ${username}`
      );
      if (!timelineResponse.ok) {
        throw new Error(
          `X API timeline for ${username} failed with status ${timelineResponse.status}`
        );
      }
      const timeline = twitterTimelineSchema.parse(
        await timelineResponse.json()
      );

      return {
        handle: account.username,
        name: account.name,
        bio: account.description ?? null,
        followers: account.public_metrics?.followers_count ?? null,
        source: "x_api",
        tweets: (timeline.data ?? []).slice(0, count).map((tweet) => ({
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at ?? null,
          likes: tweet.public_metrics?.like_count ?? 0,
          retweets: tweet.public_metrics?.retweet_count ?? 0,
          replies: tweet.public_metrics?.reply_count ?? 0,
          url: `https://x.com/${account.username}/status/${tweet.id}`,
        })),
      };
    },
  });
}
