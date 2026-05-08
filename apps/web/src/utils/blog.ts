import { unstable_cache } from "next/cache";
import {
  type NotraApiPost,
  notraApiListPostsResponseSchema,
} from "@/schemas/notra-api";
import { API_URL } from "@/utils/urls";
import type { BlogTimelineItem, NotraBlogPost } from "~types/blog";

const BLOG_CONTENT_TYPE = "blog_post";
const BLOG_STATUS = "published";
const DEFAULT_POST_LIMIT = 100;
const FALLBACK_EXCERPT_MAX_LENGTH = 160;
const BLOCK_SEPARATOR_REGEX = /\n\s*\n/;

function getNotraBlogConfig() {
  return {
    apiKey: process.env.NOTRA_API_KEY?.trim() ?? "",
  };
}

async function fetchNotraBlogPosts(apiKey: string): Promise<NotraApiPost[]> {
  const url = new URL("/v1/posts", API_URL);
  url.searchParams.set("contentType", BLOG_CONTENT_TYPE);
  url.searchParams.set("status", BLOG_STATUS);
  url.searchParams.set("sort", "desc");
  url.searchParams.set("limit", String(DEFAULT_POST_LIMIT));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Notra API responded with ${response.status}`);
  }

  const parsed = notraApiListPostsResponseSchema.parse(await response.json());
  return parsed.posts;
}

function sortPostsByCreatedAt(posts: NotraBlogPost[]) {
  return [...posts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function stripMarkdownFormatting(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/[>#*_~]+/g, "")
    .replace(/^-\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getPostExcerpt(markdown: string, fallbackTitle: string) {
  const blocks = markdown
    .split(BLOCK_SEPARATOR_REGEX)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    if (block.startsWith("#")) {
      continue;
    }

    const excerpt = stripMarkdownFormatting(block);
    if (excerpt.length > 0) {
      return excerpt.slice(0, FALLBACK_EXCERPT_MAX_LENGTH);
    }
  }

  const stripped = stripMarkdownFormatting(markdown);
  if (stripped.length > 0) {
    return stripped.slice(0, FALLBACK_EXCERPT_MAX_LENGTH);
  }

  return `${fallbackTitle} on the Notra blog.`;
}

function slugifySegment(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "post";
}

function normalizePost(post: NotraApiPost): NotraBlogPost {
  const apiSlug = typeof post.slug === "string" ? post.slug.trim() : "";
  const slug =
    apiSlug.length > 0 ? apiSlug : createBlogPostSlug({ title: post.title });

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    markdown: post.markdown,
    recommendations: post.recommendations ?? null,
    contentType: post.contentType,
    sourceMetadata: null,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    slug,
    excerpt: getPostExcerpt(post.markdown, post.title),
  };
}

const fetchBlogPosts = unstable_cache(
  async () => {
    const { apiKey } = getNotraBlogConfig();

    if (!apiKey) {
      return [] satisfies NotraBlogPost[];
    }

    try {
      const posts = await fetchNotraBlogPosts(apiKey);
      return sortPostsByCreatedAt(posts.map(normalizePost));
    } catch (error) {
      console.error("Failed to load Notra blog posts", error);
      return [] satisfies NotraBlogPost[];
    }
  },
  ["notra-blog-posts"],
  {
    revalidate: 3000,
  }
);

function createBlogPostSlug(post: Pick<NotraBlogPost, "title">) {
  return slugifySegment(post.title);
}

function getBlogPostHref(slug: string) {
  return `/blog/${slug}`;
}

export function formatBlogDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function listNotraBlogPosts() {
  return fetchBlogPosts();
}

export async function getNotraBlogPostBySlug(slug: string) {
  const posts = await listNotraBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function buildBlogTimelineItems(
  posts: NotraBlogPost[]
): BlogTimelineItem[] {
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.excerpt,
    href: getBlogPostHref(post.slug),
    date: post.createdAt,
  }));
}
