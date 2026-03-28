import { Notra } from "@usenotra/sdk";
import type {
  GetPostPost,
  ListPostsPost,
} from "@usenotra/sdk/models/operations";
import { unstable_cache } from "next/cache";
import type { BlogTimelineItem, NotraBlogPost } from "~types/blog";

const BLOG_CONTENT_TYPE = "blog_post";
const BLOG_STATUS = "published";
const DEFAULT_POST_LIMIT = 100;
const FALLBACK_EXCERPT = "Insights, guides, and stories from the Notra team.";
const BLOCK_SEPARATOR_REGEX = /\n\s*\n/;

function getNotraBlogConfig() {
  return {
    apiKey: process.env.NOTRA_API_KEY?.trim() ?? "",
  };
}

function createNotraClient(apiKey: string) {
  return new Notra({
    bearerAuth: apiKey,
  });
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

function getPostExcerpt(markdown: string) {
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
      return excerpt;
    }
  }

  return FALLBACK_EXCERPT;
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

function normalizePost(post: ListPostsPost | GetPostPost): NotraBlogPost {
  const slug =
    "slug" in post && typeof post.slug === "string"
      ? post.slug
      : createBlogPostSlug({ title: post.title });

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
    excerpt: getPostExcerpt(post.markdown),
  };
}

const fetchBlogPosts = unstable_cache(
  async () => {
    const { apiKey } = getNotraBlogConfig();

    if (!apiKey) {
      return [] satisfies NotraBlogPost[];
    }

    try {
      const client = createNotraClient(apiKey);
      const response = await client.content.listPosts({
        contentType: BLOG_CONTENT_TYPE,
        limit: DEFAULT_POST_LIMIT,
        sort: "desc",
        status: BLOG_STATUS,
      });

      return sortPostsByCreatedAt(response.posts.map(normalizePost));
    } catch (error) {
      console.error("Failed to load Notra blog posts", error);
      return [] satisfies NotraBlogPost[];
    }
  },
  ["notra-blog-posts"],
  {
    revalidate: 300,
  }
);

export function createBlogPostSlug(post: Pick<NotraBlogPost, "title">) {
  return slugifySegment(post.title);
}

export function getBlogPostHref(slug: string) {
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
