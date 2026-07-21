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
        <h1 className="text-balance font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
          The Notra <span className="text-primary">Blog</span>
        </h1>
        <div className="text-balance font-sans text-base text-muted-foreground leading-7">
          Insights, guides, and stories from the Notra team.
        </div>
      </div>

      {cardItems.length === 0 ? (
        <div className="mt-14 w-full">
          <div className="rounded-2xl border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
            <h2 className="font-sans font-semibold text-foreground text-xl">
              No posts yet
            </h2>
            <p className="mt-2 font-sans text-muted-foreground text-sm leading-6">
              We&apos;ll share new articles and insights here soon.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-14 grid w-full grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
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
