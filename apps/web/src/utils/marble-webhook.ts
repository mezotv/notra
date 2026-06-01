import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  BLOG_AUTHOR_PATH,
  BLOG_INDEX_PATH,
  CHANGELOG_INDEX_PATH,
  LLMS_FULL_PATH,
  LLMS_PATH,
  MARBLE_BLOG_CATEGORY_SLUG,
  MARBLE_CACHE_TAGS,
  MARBLE_CHANGELOG_CATEGORY_SLUG,
  NOTRA_CHANGELOG_INDEX_PATH,
  RSS_FEED_PATH,
  SITEMAP_PATH,
} from "@/utils/constants";
import { getMarblePostCacheTag } from "@/utils/marble";
import type {
  MarbleWebhookPayload,
  RevalidateMarbleContentOptions,
} from "~types/marble";

const SHARED_CONTENT_PATHS = [
  SITEMAP_PATH,
  LLMS_PATH,
  LLMS_FULL_PATH,
  "/md/blog",
  "/md/changelog",
  "/md/changelog/notra",
] as const;

const HEX_STRING_REGEX = /^[a-f0-9]+$/i;
const SHA256_PREFIX_REGEX = /^sha256=/;

function safeHexBuffer(value: string) {
  if (!HEX_STRING_REGEX.test(value)) {
    return null;
  }

  return Buffer.from(value, "hex");
}

function getCategorySlug(payload: MarbleWebhookPayload) {
  const category = payload.data?.category;

  if (typeof category === "string") {
    return category;
  }

  return category?.slug ?? payload.data?.categorySlug;
}

function revalidateSharedContentPaths() {
  for (const path of SHARED_CONTENT_PATHS) {
    revalidatePath(path);
  }
}

function revalidateBlogContent(slug?: string) {
  revalidateTag(MARBLE_CACHE_TAGS.blogPosts, { expire: 0 });
  revalidateTag(`${MARBLE_CACHE_TAGS.blogPosts}:${MARBLE_BLOG_CATEGORY_SLUG}`, {
    expire: 0,
  });
  revalidatePath(BLOG_INDEX_PATH);
  revalidatePath(RSS_FEED_PATH);

  if (slug) {
    revalidateTag(getMarblePostCacheTag(slug), { expire: 0 });
    revalidatePath(`${BLOG_INDEX_PATH}/${slug}`);
    revalidatePath(`/md${BLOG_INDEX_PATH}/${slug}`);
  }
}

function revalidateChangelogContent(slug?: string) {
  revalidateTag(MARBLE_CACHE_TAGS.changelogPosts, { expire: 0 });
  revalidateTag(
    `${MARBLE_CACHE_TAGS.changelogPosts}:${MARBLE_CHANGELOG_CATEGORY_SLUG}`,
    { expire: 0 }
  );
  revalidatePath(CHANGELOG_INDEX_PATH);
  revalidatePath(NOTRA_CHANGELOG_INDEX_PATH);

  if (slug) {
    revalidateTag(getMarblePostCacheTag(slug), { expire: 0 });
    revalidatePath(`${NOTRA_CHANGELOG_INDEX_PATH}/${slug}`);
    revalidatePath(`/md${NOTRA_CHANGELOG_INDEX_PATH}/${slug}`);
  }
}

function revalidateAuthorContent(slug?: string) {
  revalidateTag(MARBLE_CACHE_TAGS.blogAuthors, { expire: 0 });
  revalidateBlogContent();
  revalidateSharedContentPaths();

  if (slug) {
    revalidatePath(`${BLOG_AUTHOR_PATH}/${slug}`);
  }
}

export function verifyMarbleSignature(
  secret: string,
  signatureHeader: string,
  bodyText: string
) {
  const expectedHex = signatureHeader.replace(SHA256_PREFIX_REGEX, "");
  const expected = safeHexBuffer(expectedHex);

  if (!expected) {
    return false;
  }

  const computed = Buffer.from(
    createHmac("sha256", secret).update(bodyText).digest("hex"),
    "hex"
  );

  if (expected.length !== computed.length) {
    return false;
  }

  return timingSafeEqual(expected, computed);
}

export function revalidateMarbleContent({
  category,
  slug,
}: RevalidateMarbleContentOptions = {}) {
  const normalizedCategory = category?.toLowerCase();
  const shouldRevalidateBlog =
    !normalizedCategory || normalizedCategory === MARBLE_BLOG_CATEGORY_SLUG;
  const shouldRevalidateChangelog =
    !normalizedCategory ||
    normalizedCategory === MARBLE_CHANGELOG_CATEGORY_SLUG;

  if (shouldRevalidateBlog) {
    revalidateBlogContent(slug);
  }

  if (shouldRevalidateChangelog) {
    revalidateChangelogContent(slug);
  }

  revalidateSharedContentPaths();

  return {
    revalidated: shouldRevalidateBlog || shouldRevalidateChangelog,
    revalidatedBlog: shouldRevalidateBlog,
    revalidatedChangelog: shouldRevalidateChangelog,
    slug: slug ?? null,
    category: normalizedCategory ?? null,
    now: Date.now(),
  };
}

export function handleMarbleWebhookEvent(payload: MarbleWebhookPayload) {
  const event = payload.event ?? payload.type;

  if (event?.startsWith("author.")) {
    revalidateAuthorContent(payload.data?.slug);

    return {
      event,
      revalidated: true,
      revalidatedAuthors: true,
      slug: payload.data?.slug ?? null,
      now: Date.now(),
    };
  }

  if (!event?.startsWith("post.")) {
    return {
      revalidated: false,
      event: event ?? null,
      message: "Event ignored",
      now: Date.now(),
    };
  }

  return {
    event,
    ...revalidateMarbleContent({
      category: getCategorySlug(payload),
      slug: payload.data?.slug,
    }),
  };
}
