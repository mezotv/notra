import { Marble } from "@usemarble/sdk";
import { type Author, ContentFormat, type Post } from "@usemarble/sdk/models";
import {
  MARBLE_DEFAULT_POST_LIMIT,
  MARBLE_POST_CACHE_TAG_PREFIX,
} from "@/utils/constants";

interface MarbleConfig {
  apiKey: string;
}

interface ListMarblePublishedPostsOptions {
  category: string;
}

export interface MarblePublishedPost extends Omit<Post, "content"> {
  content: string;
  markdown: string;
}

export function getMarblePostCacheTag(slug: string) {
  return `${MARBLE_POST_CACHE_TAG_PREFIX}:${slug}`;
}

function getMarbleConfig(): MarbleConfig {
  return {
    apiKey: process.env.MARBLE_API_KEY?.trim() ?? "",
  };
}

function createMarbleClient(apiKey: string) {
  return new Marble({
    apiKey,
  });
}

function sortMarblePostsByPublishedAt<T extends Pick<Post, "publishedAt">>(
  posts: T[]
) {
  return posts
    .slice()
    .sort(
      (firstPost, secondPost) =>
        secondPost.publishedAt.getTime() - firstPost.publishedAt.getTime()
    );
}

async function listPostsByFormat(
  client: Marble,
  { category }: ListMarblePublishedPostsOptions,
  format: ContentFormat
) {
  const iterator = await client.posts.list({
    categories: [category],
    format,
    limit: MARBLE_DEFAULT_POST_LIMIT,
    order: "desc",
    status: "published",
  });

  const posts: Post[] = [];

  for await (const page of iterator) {
    posts.push(...page.result.posts);
  }

  return posts;
}

export async function listMarblePublishedPosts({
  category,
}: ListMarblePublishedPostsOptions): Promise<MarblePublishedPost[]> {
  const { apiKey } = getMarbleConfig();

  if (!apiKey) {
    return [];
  }

  const client = createMarbleClient(apiKey);
  const [htmlPosts, markdownPosts] = await Promise.all([
    listPostsByFormat(client, { category }, ContentFormat.Html),
    listPostsByFormat(client, { category }, ContentFormat.Markdown),
  ]);
  const markdownById = new Map(
    markdownPosts.map((post) => [post.id, post.content])
  );

  return sortMarblePostsByPublishedAt(
    htmlPosts.map((post) => ({
      ...post,
      markdown: markdownById.get(post.id) ?? "",
    }))
  );
}

export async function listMarbleAuthors(): Promise<Author[]> {
  const { apiKey } = getMarbleConfig();

  if (!apiKey) {
    return [];
  }

  const client = createMarbleClient(apiKey);
  const iterator = await client.authors.list({
    limit: MARBLE_DEFAULT_POST_LIMIT,
  });

  const authors: Author[] = [];

  for await (const page of iterator) {
    authors.push(...page.result.authors);
  }

  return authors;
}
