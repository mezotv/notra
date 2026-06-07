import { unstable_cache } from "next/cache";
import { getAuthorHref } from "@/utils/authors";
import {
  BLOG_CATEGORY_FALLBACK_DESCRIPTION,
  BLOG_CATEGORY_PATH,
  BLOG_INDEX_PATH,
  BLOG_TAB_CHANGELOG_LABEL,
  BLOG_TAB_OVERVIEW_LABEL,
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
  BlogCardAuthor,
  BlogCardItem,
  BlogCategory,
  BlogCategoryTab,
  BlogPaginationLink,
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
  const authors: NotraBlogAuthor[] = (post.authors ?? []).map((author) => ({
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
    category: post.category
      ? {
          name: post.category.name,
          slug: post.category.slug,
          description: post.category.description,
        }
      : null,
  };
}

const fetchBlogPosts = unstable_cache(
  async () => {
    try {
      const posts = await listMarblePublishedPosts({
        excludeCategory: MARBLE_CHANGELOG_CATEGORY_SLUG,
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
    tags: [MARBLE_CACHE_TAGS.blogPosts],
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
      tags: [MARBLE_CACHE_TAGS.blogPosts, getMarblePostCacheTag(slug)],
    }
  )();
  return posts.find((post) => post.slug === slug) ?? null;
}

export function toBlogCardAuthor(
  author: NotraBlogAuthor | undefined
): BlogCardAuthor | null {
  if (!author) {
    return null;
  }

  return {
    name: author.name,
    image: author.image,
    slug: author.slug,
    href: getAuthorHref(author.slug),
  };
}

export function buildBlogCardItems(posts: NotraBlogPost[]): BlogCardItem[] {
  return posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.excerpt,
    href: getBlogPostHref(post.slug),
    date: post.createdAt,
    author: toBlogCardAuthor(post.authors[0]),
    kind: "blog",
  }));
}

export async function listNotraBlogPostsByCategory(categorySlug: string) {
  const posts = await listNotraBlogPosts();
  return posts.filter((post) => post.category?.slug === categorySlug);
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  const posts = await listNotraBlogPosts();
  const categories = new Map<string, BlogCategory>();

  for (const post of posts) {
    if (!post.category) {
      continue;
    }

    const existing = categories.get(post.category.slug);

    if (existing) {
      existing.count += 1;
      continue;
    }

    categories.set(post.category.slug, {
      name: post.category.name,
      slug: post.category.slug,
      description: post.category.description,
      count: 1,
    });
  }

  return [...categories.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.name.localeCompare(right.name);
  });
}

export async function getBlogCategoryBySlug(categorySlug: string) {
  const categories = await listBlogCategories();
  return categories.find((category) => category.slug === categorySlug) ?? null;
}

export function getBlogCategoryHref(categorySlug: string) {
  return `${BLOG_CATEGORY_PATH}/${categorySlug}`;
}

export function getBlogCategoryDescription(category: BlogCategory) {
  return category.description?.trim() || BLOG_CATEGORY_FALLBACK_DESCRIPTION;
}

export function buildBlogCategoryTabs(
  categories: BlogCategory[]
): BlogCategoryTab[] {
  return [
    {
      key: "overview",
      name: BLOG_TAB_OVERVIEW_LABEL,
      href: BLOG_INDEX_PATH,
      kind: "overview",
    },
    ...categories.map(
      (category): BlogCategoryTab => ({
        key: category.slug,
        name: category.name,
        href: getBlogCategoryHref(category.slug),
        kind: "category",
      })
    ),
    {
      key: "changelog",
      name: BLOG_TAB_CHANGELOG_LABEL,
      href: NOTRA_CHANGELOG_INDEX_PATH,
      kind: "changelog",
    },
  ];
}

function buildBlogPaginationLink(post: NotraBlogPost): BlogPaginationLink {
  return {
    slug: post.slug,
    href: getBlogPostHref(post.slug),
    title: post.title,
    author: toBlogCardAuthor(post.authors[0]),
  };
}

export async function getNotraBlogPostPagination(slug: string) {
  const posts = await listNotraBlogPosts();
  const index = posts.findIndex((post) => post.slug === slug);

  if (index === -1) {
    return { previous: null, next: null };
  }

  const olderPost = posts[index + 1] ?? null;
  const newerPost = posts[index - 1] ?? null;

  return {
    previous: olderPost ? buildBlogPaginationLink(olderPost) : null,
    next: newerPost ? buildBlogPaginationLink(newerPost) : null,
  };
}
