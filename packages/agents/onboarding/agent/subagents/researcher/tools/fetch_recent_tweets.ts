import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import {
  HANDLE_PREFIX_REGEX,
  RECENT_TWEETS_API_MIN_COUNT,
  RECENT_TWEETS_DEFAULT_COUNT,
  RECENT_TWEETS_MAX_COUNT,
  TWITTER_API_BASE,
} from "../../../lib/constants/twitter";
import {
  twitterTimelineSchema,
  twitterUserLookupSchema,
} from "../../../lib/schemas/twitter";
import { getTwitterHeaders } from "../../../lib/utils/twitter";

export default defineTool({
  description:
    "Fetch a company's recent original tweets from the X API by handle, with engagement metrics. Use to study their real social voice.",
  inputSchema: z.object({
    handle: z.string().min(1),
    count: z
      .number()
      .int()
      .min(1)
      .max(RECENT_TWEETS_MAX_COUNT)
      .default(RECENT_TWEETS_DEFAULT_COUNT),
  }),
  async execute({ handle, count }) {
    const headers = getTwitterHeaders();
    const username = handle.replace(HANDLE_PREFIX_REGEX, "");

    const userResponse = await fetch(
      `${TWITTER_API_BASE}/users/by/username/${encodeURIComponent(username)}?user.fields=description,public_metrics`,
      { headers }
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
      max_results: String(Math.max(count, RECENT_TWEETS_API_MIN_COUNT)),
      exclude: "replies,retweets",
      "tweet.fields": "text,public_metrics,created_at",
    });
    const timelineResponse = await fetch(
      `${TWITTER_API_BASE}/users/${account.id}/tweets?${timelineParams.toString()}`,
      { headers }
    );
    if (!timelineResponse.ok) {
      throw new Error(
        `X API timeline for ${username} failed with status ${timelineResponse.status}`
      );
    }
    const timeline = twitterTimelineSchema.parse(await timelineResponse.json());

    return {
      handle: account.username,
      name: account.name,
      bio: account.description ?? null,
      followers: account.public_metrics?.followers_count ?? null,
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
