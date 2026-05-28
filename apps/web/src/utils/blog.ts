import { unstable_cache } from "next/cache";
import {
  BLOG_INDEX_PATH,
  MARBLE_BLOG_CATEGORY_SLUG,
  MARBLE_CACHE_KEYS,
  MARBLE_CACHE_TAGS,
  MARBLE_REVALIDATE_SECONDS,
} from "@/utils/constants";
import {
  getMarblePostCacheTag,
  listMarblePublishedPosts,
  type MarblePublishedPost,
} from "@/utils/marble";
import type {
  BlogTimelineItem,
  NotraBlogAuthor,
  NotraBlogPost,
} from "~types/blog";

const BLOG_CONTENT_TYPE = "blog_post";
const FALLBACK_EXCERPT_MAX_LENGTH = 160;
const BLOCK_SEPARATOR_REGEX = /\n\s*\n/;

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

function normalizePost(post: MarblePublishedPost): NotraBlogPost {
  const apiSlug = typeof post.slug === "string" ? post.slug.trim() : "";
  const slug =
    apiSlug.length > 0 ? apiSlug : createBlogPostSlug({ title: post.title });
  const createdAt = post.publishedAt.toISOString();
  const markdown = post.markdown || post.content;
  const authors: NotraBlogAuthor[] = post.authors.map((author) => ({
    id: author.id,
    name: author.name,
    image: author.image,
    slug: author.slug,
    bio: author.bio,
    role: author.role,
    socials: author.socials.map((social) => ({
      url: social.url,
      platform: social.platform,
    })),
  }));

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    markdown,
    recommendations: null,
    contentType: BLOG_CONTENT_TYPE,
    sourceMetadata: null,
    status: post.status,
    createdAt,
    updatedAt: post.updatedAt.toISOString(),
    slug,
    excerpt: post.description.trim() || getPostExcerpt(markdown, post.title),
    authors,
  };
}

const fetchBlogPosts = unstable_cache(
  async () => {
    try {
      const posts = await listMarblePublishedPosts({
        category: MARBLE_BLOG_CATEGORY_SLUG,
      });
      return posts.map(normalizePost);
    } catch (error) {
      console.error("Failed to load Marble blog posts", error);
      return [] satisfies NotraBlogPost[];
    }
  },
  [MARBLE_CACHE_KEYS.blogPosts],
  {
    revalidate: MARBLE_REVALIDATE_SECONDS.blogPosts,
    tags: [
      MARBLE_CACHE_TAGS.blogPosts,
      `${MARBLE_CACHE_TAGS.blogPosts}:${MARBLE_BLOG_CATEGORY_SLUG}`,
    ],
  }
);

function createBlogPostSlug(post: Pick<NotraBlogPost, "title">) {
  return slugifySegment(post.title);
}

function getBlogPostHref(slug: string) {
  return `${BLOG_INDEX_PATH}/${slug}`;
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
  const posts = await unstable_cache(
    listNotraBlogPosts,
    [MARBLE_CACHE_KEYS.blogPosts, slug],
    {
      revalidate: MARBLE_REVALIDATE_SECONDS.blogPosts,
      tags: [
        MARBLE_CACHE_TAGS.blogPosts,
        `${MARBLE_CACHE_TAGS.blogPosts}:${MARBLE_BLOG_CATEGORY_SLUG}`,
        getMarblePostCacheTag(slug),
      ],
    }
  )();
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
