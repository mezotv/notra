import { unstable_cache } from "next/cache";
import {
  BLOG_AUTHOR_PATH,
  MARBLE_CACHE_KEYS,
  MARBLE_CACHE_TAGS,
  MARBLE_REVALIDATE_SECONDS,
} from "@/utils/constants";
import { listMarbleAuthors } from "@/utils/marble";
import type { NotraAuthor, NotraBlogPost } from "~types/blog";

function normalizeAuthor(author: {
  id: string;
  name: string;
  image: string | null;
  slug: string;
  bio: string | null;
  role: string | null;
  socials: { url: string; platform: string }[];
  count?: { posts: number };
}): NotraAuthor {
  return {
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
    postCount: author.count?.posts ?? 0,
  };
}

const fetchAuthors = unstable_cache(
  async () => {
    try {
      const authors = await listMarbleAuthors();
      return authors.map(normalizeAuthor);
    } catch (error) {
      console.error("Failed to load Marble authors", error);
      return [] satisfies NotraAuthor[];
    }
  },
  [MARBLE_CACHE_KEYS.blogAuthors],
  {
    revalidate: MARBLE_REVALIDATE_SECONDS.blogAuthors,
    tags: [MARBLE_CACHE_TAGS.blogAuthors],
  }
);

export function getAuthorHref(slug: string) {
  return `${BLOG_AUTHOR_PATH}/${slug}`;
}

export async function listNotraAuthors() {
  return fetchAuthors();
}

export async function getNotraAuthorBySlug(slug: string) {
  const authors = await listNotraAuthors();
  return authors.find((author) => author.slug === slug) ?? null;
}

export function filterPostsByAuthorSlug(
  posts: NotraBlogPost[],
  slug: string
): NotraBlogPost[] {
  return posts.filter((post) =>
    post.authors.some((author) => author.slug === slug)
  );
}
