import { z } from "zod";
import {
  SITEMAP_DEFAULT_MAX_LINKS,
  WEB_SEARCH_MAX_RESULTS,
} from "../constants/context-dev";
import {
  RECENT_TWEETS_DEFAULT_COUNT,
  RECENT_TWEETS_MAX_COUNT,
  RECENT_TWEETS_MIN_COUNT,
} from "../constants/twitter";

export const companyDomainInputSchema = z.object({
  domain: z.string().min(1),
});

export const crawlSitemapInputSchema = z.object({
  domain: z.string().min(1),
  urlRegex: z.string().optional(),
  maxLinks: z.number().int().min(1).max(500).default(SITEMAP_DEFAULT_MAX_LINKS),
});

export const githubRepositoryInputSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

export const recentTweetsInputSchema = z.object({
  handle: z.string().min(1),
  count: z
    .number()
    .int()
    .min(RECENT_TWEETS_MIN_COUNT)
    .max(RECENT_TWEETS_MAX_COUNT)
    .default(RECENT_TWEETS_DEFAULT_COUNT),
});

export const webpageInputSchema = z.object({
  url: z.url(),
});

export const webpagesInputSchema = z.object({
  urls: z.array(z.url()).min(1).max(50),
});

export const webSearchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(WEB_SEARCH_MAX_RESULTS).optional(),
});
