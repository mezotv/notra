import type { ContextDevSearchResult } from "@notra/ai/types/context-dev";
import { searchWeb } from "@notra/ai/utils/context-dev";
import {
  PUBLIC_TWEET_SEARCH_QUERY_TEMPLATES,
  PUBLIC_TWEET_SEARCH_QUERY_TOKEN,
  PUBLIC_TWEET_TEXT_MAX_LENGTH,
  PUBLIC_TWEET_TEXT_MIN_LENGTH,
  TWITTER_MARKDOWN_AUTHOR_REGEX,
  TWITTER_MARKDOWN_ESCAPE_REGEX,
  TWITTER_MARKDOWN_IMAGE_REGEX,
  TWITTER_MARKDOWN_LINK_REGEX,
  TWITTER_MARKDOWN_NEWLINES_REGEX,
  TWITTER_MARKDOWN_POST_HEADING,
  TWITTER_MARKDOWN_QUOTE_REGEX,
  TWITTER_MARKDOWN_TIME_REGEX,
  TWITTER_STATUS_ID_REGEX,
  TWITTER_WWW_PREFIX_PATTERN,
} from "../constants/twitter";
import type { RecentTweet, RecentTweetsResult } from "../types/twitter";
import { withTransientRetry } from "./retry";

export function getTwitterHeaders(): Record<string, string> | null {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN?.trim();
  if (!bearerToken) {
    return null;
  }
  return { Authorization: `Bearer ${bearerToken}` };
}

function getTweetIdentity(url: string, username: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname
      .toLowerCase()
      .replace(TWITTER_WWW_PREFIX_PATTERN, "");
    if (hostname !== "x.com" && hostname !== "twitter.com") {
      return null;
    }
    const [handle, statusSegment, id] = parsed.pathname
      .split("/")
      .filter(Boolean);
    if (
      handle?.toLowerCase() !== username.toLowerCase() ||
      statusSegment !== "status" ||
      !id ||
      !TWITTER_STATUS_ID_REGEX.test(id)
    ) {
      return null;
    }
    return { handle, id };
  } catch {
    return null;
  }
}

function cleanTweetMarkdown(value: string) {
  return value
    .replace(TWITTER_MARKDOWN_IMAGE_REGEX, "")
    .replace(TWITTER_MARKDOWN_LINK_REGEX, "$1")
    .replace(TWITTER_MARKDOWN_ESCAPE_REGEX, "$1")
    .replace(TWITTER_MARKDOWN_TIME_REGEX, "")
    .replace(TWITTER_MARKDOWN_NEWLINES_REGEX, "\n\n")
    .trim();
}

function extractMarkdownTweet(
  markdown: string,
  id: string
): { handle: string; name: string; text: string; url: string } | null {
  const postStart = markdown.lastIndexOf(TWITTER_MARKDOWN_POST_HEADING);
  const post = postStart === -1 ? markdown : markdown.slice(postStart);
  const authorMatch = post.match(TWITTER_MARKDOWN_AUTHOR_REGEX);
  if (!authorMatch || authorMatch.index === undefined) {
    return null;
  }
  const bodyStart = authorMatch.index + authorMatch[0].length;
  const body = post.slice(bodyStart);
  const timestampPattern = new RegExp(
    `\\n\\n\\[[^\\]]*·[^\\]]*\\]\\((https:\\/\\/x\\.com\\/([^/]+)\\/status\\/${id})\\)`
  );
  const timestampMatch = body.match(timestampPattern);
  if (!timestampMatch || timestampMatch.index === undefined) {
    return null;
  }
  const quoteMatch = body
    .slice(0, timestampMatch.index)
    .match(TWITTER_MARKDOWN_QUOTE_REGEX);
  const bodyEnd = quoteMatch?.index ?? timestampMatch.index;
  const text = cleanTweetMarkdown(body.slice(0, bodyEnd));
  const handle = cleanTweetMarkdown(timestampMatch[2] ?? authorMatch[2] ?? "");
  const name = cleanTweetMarkdown(authorMatch[1] ?? handle);
  const url = timestampMatch[1];
  if (
    !handle ||
    !url ||
    text.length < PUBLIC_TWEET_TEXT_MIN_LENGTH ||
    text.length > PUBLIC_TWEET_TEXT_MAX_LENGTH
  ) {
    return null;
  }
  return { handle, name, text, url };
}

function extractSearchText(result: ContextDevSearchResult) {
  const description = result.description.trim();
  if (
    description.length < PUBLIC_TWEET_TEXT_MIN_LENGTH ||
    description.length > PUBLIC_TWEET_TEXT_MAX_LENGTH ||
    description.endsWith("...") ||
    description.endsWith("…")
  ) {
    return null;
  }
  return description;
}

function toPublicTweet(
  result: ContextDevSearchResult,
  username: string
): { handle: string; name: string; tweet: RecentTweet } | null {
  const identity = getTweetIdentity(result.url, username);
  if (!identity) {
    return null;
  }
  const markdown = result.markdown?.markdown;
  const extracted = markdown
    ? extractMarkdownTweet(markdown, identity.id)
    : null;
  const text = extracted?.text ?? extractSearchText(result);
  if (!text) {
    return null;
  }
  const handle = extracted?.handle ?? identity.handle;
  const url = extracted?.url ?? `https://x.com/${handle}/status/${identity.id}`;
  return {
    handle,
    name: extracted?.name ?? result.title,
    tweet: {
      id: identity.id,
      text,
      createdAt: null,
      likes: null,
      retweets: null,
      replies: null,
      url,
    },
  };
}

export async function fetchPublicRecentTweets(
  username: string,
  count: number
): Promise<RecentTweetsResult> {
  const queries = PUBLIC_TWEET_SEARCH_QUERY_TEMPLATES.map((template) =>
    template.replace(PUBLIC_TWEET_SEARCH_QUERY_TOKEN, username)
  );
  const resultGroups = await Promise.all(
    queries.map((query) =>
      withTransientRetry(
        () =>
          searchWeb({
            query,
            limit: count,
            includeDomains: ["x.com", "twitter.com"],
            queryFanout: true,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true,
            },
          }),
        { operationName: `Public X search for ${username}` }
      ).then(
        (response) => response.results,
        () => []
      )
    )
  );
  const tweets = new Map<string, RecentTweet>();
  let handle = username;
  let name = username;
  for (const result of resultGroups.flat()) {
    const parsed = toPublicTweet(result, username);
    if (parsed && !tweets.has(parsed.tweet.id)) {
      tweets.set(parsed.tweet.id, parsed.tweet);
      handle = parsed.handle;
      name = parsed.name;
    }
  }
  return {
    handle,
    name,
    bio: null,
    followers: null,
    source: "public_web",
    tweets: [...tweets.values()].slice(0, count),
  };
}
