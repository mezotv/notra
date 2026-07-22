import type { Metadata } from "next";
import { BlogPostCard } from "@/components/blog-post-card";
import { buildBlogCardItems, listNotraBlogPosts } from "@/utils/blog";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Notra Blog";
const description = "Insights, guides, and stories from the Notra team.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "Notra",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export default async function BlogPage() {
  const posts = await listNotraBlogPosts();
  const cardItems = buildBlogCardItems(posts);

  return (
    <div className="mx-auto w-full max-w-220">
      <div className="flex w-full flex-col items-start gap-4">
        <h1 className="text-balance font-display font-medium text-4xl text-[#1E1E1E] leading-[1.1] tracking-[-0.02em] md:text-6xl dark:text-white">
          The Notra <span className="text-primary">Blog</span>
        </h1>
        <div className="text-balance font-sans text-[#1E1E1E99] text-base leading-7 dark:text-white/70">
          Insights, guides, and stories from the Notra team.
        </div>
      </div>

      {cardItems.length === 0 ? (
        <div className="mt-14 w-full">
          <div className="rounded-3xl border border-[#1E1E1E1A] bg-[#C8B2EE26] px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <h2 className="font-display font-medium text-[#1E1E1E] text-xl tracking-[-0.015em] dark:text-white">
              No posts yet
            </h2>
            <p className="mt-2 font-sans text-[#1E1E1E99] text-sm leading-6 dark:text-white/60">
              We&apos;ll share new articles and insights here soon.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-14 grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          {cardItems.map((item) => (
            <li className="h-full" key={item.id}>
              <BlogPostCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
