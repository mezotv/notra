// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export const twitterUserLookupSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    description: z.string().optional(),
    public_metrics: z
      .object({
        followers_count: z.number().optional(),
        tweet_count: z.number().optional(),
      })
      .optional(),
  }),
});

export const twitterTimelineSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        created_at: z.string().optional(),
        public_metrics: z
          .object({
            like_count: z.number().optional(),
            retweet_count: z.number().optional(),
            reply_count: z.number().optional(),
          })
          .optional(),
      })
    )
    .optional(),
});
