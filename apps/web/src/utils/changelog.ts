import { unstable_cache } from "next/cache";
import {
  MARBLE_CACHE_KEYS,
  MARBLE_CACHE_TAGS,
  MARBLE_CHANGELOG_CATEGORY_SLUG,
  MARBLE_REVALIDATE_SECONDS,
  NOTRA_CHANGELOG_INDEX_PATH,
} from "@/utils/constants";
import {
  getMarblePostCacheTag,
  listMarblePublishedPosts,
  type MarblePublishedPost,
} from "@/utils/marble";
import type {
  ChangelogTimelineItem,
  NotraChangelogPost,
} from "~types/changelog";

const CHANGELOG_CONTENT_TYPE = "changelog";
const FALLBACK_EXCERPT =
  "Product updates, fixes, and shipped improvements from the Notra team.";
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

  return slug || "update";
}

function normalizePost(post: MarblePublishedPost): NotraChangelogPost {
  const slug = post.slug || createChangelogPostSlug({ title: post.title });
  const createdAt = post.publishedAt.toISOString();
  const markdown = post.markdown || post.content;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    markdown,
    recommendations: null,
    contentType: CHANGELOG_CONTENT_TYPE,
    sourceMetadata: null,
    status: post.status,
    createdAt,
    updatedAt: post.updatedAt.toISOString(),
    slug,
    excerpt: post.description.trim() || getPostExcerpt(markdown),
  };
}

const fetchChangelogPosts = unstable_cache(
  async () => {
    try {
      const posts = await listMarblePublishedPosts({
        category: MARBLE_CHANGELOG_CATEGORY_SLUG,
      });
      return posts.map(normalizePost);
    } catch (error) {
      console.error("Failed to load Marble changelog posts", error);
      return [] satisfies NotraChangelogPost[];
    }
  },
  [MARBLE_CACHE_KEYS.changelogPosts],
  {
    revalidate: MARBLE_REVALIDATE_SECONDS.changelogPosts,
    tags: [
      MARBLE_CACHE_TAGS.changelogPosts,
      `${MARBLE_CACHE_TAGS.changelogPosts}:${MARBLE_CHANGELOG_CATEGORY_SLUG}`,
    ],
  }
);

function createChangelogPostSlug(post: Pick<NotraChangelogPost, "title">) {
  return slugifySegment(post.title);
}

export function getChangelogPostHref(slug: string) {
  return `${NOTRA_CHANGELOG_INDEX_PATH}/${slug}`;
}

export function formatChangelogDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function listNotraChangelogPosts() {
  return fetchChangelogPosts();
}

export async function getNotraChangelogPostBySlug(slug: string) {
  const posts = await unstable_cache(
    listNotraChangelogPosts,
    [MARBLE_CACHE_KEYS.changelogPosts, slug],
    {
      revalidate: MARBLE_REVALIDATE_SECONDS.changelogPosts,
      tags: [
        MARBLE_CACHE_TAGS.changelogPosts,
        `${MARBLE_CACHE_TAGS.changelogPosts}:${MARBLE_CHANGELOG_CATEGORY_SLUG}`,
        getMarblePostCacheTag(slug),
      ],
    }
  )();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function buildChangelogTimelineItems(
  posts: NotraChangelogPost[]
): ChangelogTimelineItem[] {
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.excerpt,
    href: getChangelogPostHref(post.slug),
    date: post.createdAt,
  }));
}
