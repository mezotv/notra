import { listNotraBlogPosts } from "@/utils/blog";
import { buildBlogRssFeed, rssResponse } from "@/utils/rss";

export const revalidate = 3000;

export async function GET() {
  const posts = await listNotraBlogPosts();
  return rssResponse(buildBlogRssFeed(posts));
}
