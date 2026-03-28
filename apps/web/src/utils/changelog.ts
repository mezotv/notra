import { Notra } from "@usenotra/sdk";
import type {
  GetPostPost,
  ListPostsPost,
} from "@usenotra/sdk/models/operations";
import { unstable_cache } from "next/cache";
import type {
  ChangelogTimelineItem,
  NotraChangelogPost,
  NotraSourceMetadata,
} from "~types/changelog";

const CHANGELOG_CONTENT_TYPE = "changelog";
const CHANGELOG_STATUS = "published";
const DEFAULT_POST_LIMIT = 100;
const FALLBACK_EXCERPT =
  "Product updates, fixes, and shipped improvements from the Notra team.";
const BLOCK_SEPARATOR_REGEX = /\n\s*\n/;

function getNotraChangelogConfig() {
  return {
    apiKey: process.env.NOTRA_API_KEY?.trim() ?? "",
  };
}

function createNotraClient(apiKey: string) {
  return new Notra({
    bearerAuth: apiKey,
  });
}

function sortPostsByCreatedAt(posts: NotraChangelogPost[]) {
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

  return slug || "update";
}

function normalizePost(post: ListPostsPost | GetPostPost): NotraChangelogPost {
  const slug =
    "slug" in post && typeof post.slug === "string"
      ? post.slug
      : createChangelogPostSlug({ title: post.title });

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    markdown: post.markdown,
    recommendations: post.recommendations ?? null,
    contentType: post.contentType,
    sourceMetadata:
      (post.sourceMetadata as NotraSourceMetadata | undefined) ?? null,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    slug,
    excerpt: getPostExcerpt(post.markdown),
  };
}

const fetchChangelogPosts = unstable_cache(
  async () => {
    const { apiKey } = getNotraChangelogConfig();

    if (!apiKey) {
      return [] satisfies NotraChangelogPost[];
    }

    try {
      const client = createNotraClient(apiKey);
      const response = await client.content.listPosts({
        contentType: CHANGELOG_CONTENT_TYPE,
        limit: DEFAULT_POST_LIMIT,
        sort: "desc",
        status: CHANGELOG_STATUS,
      });

      return sortPostsByCreatedAt(response.posts.map(normalizePost));
    } catch (error) {
      console.error("Failed to load Notra changelog posts", error);
      return [] satisfies NotraChangelogPost[];
    }
  },
  ["notra-changelog-posts"],
  {
    revalidate: 300,
  }
);

export function isNotraChangelogConfigured() {
  const { apiKey } = getNotraChangelogConfig();
  return Boolean(apiKey);
}

export function createChangelogPostSlug(
  post: Pick<NotraChangelogPost, "title">
) {
  return slugifySegment(post.title);
}

export function getChangelogPostHref(slug: string) {
  return `/changelog/notra/${slug}`;
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
  const posts = await listNotraChangelogPosts();
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
