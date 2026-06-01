import type { posts } from "@notra/db/schema";

type PostRecord = typeof posts.$inferSelect;

type SinglePostRecord = typeof posts.$inferSelect | undefined;

export function serializeAvailablePost(post: PostRecord) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    contentType: post.contentType,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function serializePostDetail(post: NonNullable<SinglePostRecord>) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    markdown: post.markdown,
    recommendations: post.recommendations,
    contentType: post.contentType,
    sourceMetadata: post.sourceMetadata,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
