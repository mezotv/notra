import type { Metadata } from "next";
import { BlogCardGrid } from "@/components/blog-card-grid";
import { BlogTabsNav } from "@/components/blog-tabs-nav";
import {
  buildBlogCardItems,
  buildBlogCategoryTabs,
  listBlogCategories,
  listNotraBlogPosts,
} from "@/utils/blog";
import {
  buildChangelogCardItems,
  listNotraChangelogPosts,
} from "@/utils/changelog";
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
  const [posts, changelogPosts, categories] = await Promise.all([
    listNotraBlogPosts(),
    listNotraChangelogPosts(),
    listBlogCategories(),
  ]);
  const tabs = buildBlogCategoryTabs(categories);
  const cardItems = [
    ...buildBlogCardItems(posts),
    ...buildChangelogCardItems(changelogPosts),
  ].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime()
  );

  return (
    <div className="mx-auto w-full max-w-220">
      <div className="flex w-full flex-col items-start gap-4">
        <h1 className="text-balance font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
          The Notra <span className="text-primary">Blog</span>
        </h1>
        <div className="text-balance font-sans text-base text-muted-foreground leading-7">
          {description}
        </div>
      </div>

      <div className="mt-8 w-full">
        <BlogTabsNav tabs={tabs} />
      </div>

      <div className="mt-12 w-full">
        <BlogCardGrid
          emptyDescription="We'll share new articles and insights here soon."
          emptyTitle="No posts yet"
          items={cardItems}
        />
      </div>
    </div>
  );
}
