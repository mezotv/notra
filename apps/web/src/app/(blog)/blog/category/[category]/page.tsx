import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCardGrid } from "@/components/blog-card-grid";
import { BlogTabsNav } from "@/components/blog-tabs-nav";
import {
  buildBlogCardItems,
  buildBlogCategoryTabs,
  getBlogCategoryBySlug,
  getBlogCategoryDescription,
  listBlogCategories,
  listNotraBlogPostsByCategory,
} from "@/utils/blog";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";
import type { BlogCategoryPageProps } from "~types/blog";

export const revalidate = 3000;

export async function generateStaticParams() {
  const categories = await listBlogCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: BlogCategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getBlogCategoryBySlug(categorySlug);

  if (!category) {
    return {};
  }

  const categoryDescription = getBlogCategoryDescription(category);
  const url = `${SITE_URL}/blog/category/${categorySlug}`;

  return {
    title: category.name,
    description: categoryDescription,
    alternates: { canonical: url },
    openGraph: {
      title: category.name,
      description: categoryDescription,
      url,
      type: "website",
      siteName: "Notra",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: category.name,
      description: categoryDescription,
      images: [DEFAULT_SOCIAL_IMAGE.url],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}

export default async function BlogCategoryPage({
  params,
}: BlogCategoryPageProps) {
  const { category: categorySlug } = await params;
  const [category, categories] = await Promise.all([
    getBlogCategoryBySlug(categorySlug),
    listBlogCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const tabs = buildBlogCategoryTabs(categories);
  const posts = await listNotraBlogPostsByCategory(categorySlug);
  const cardItems = buildBlogCardItems(posts);

  return (
    <div className="mx-auto w-full max-w-220">
      <div className="flex w-full flex-col items-start gap-4">
        <h1 className="text-balance font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
          {category.name}
        </h1>
        <div className="text-balance font-sans text-base text-muted-foreground leading-7">
          {getBlogCategoryDescription(category)}
        </div>
      </div>

      <div className="mt-8 w-full">
        <BlogTabsNav tabs={tabs} />
      </div>

      <div className="mt-12 w-full">
        <BlogCardGrid
          emptyDescription="We'll share new articles in this category soon."
          emptyTitle="No posts yet"
          items={cardItems}
        />
      </div>
    </div>
  );
}
