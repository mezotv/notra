import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { BlogArticle } from "@/components/blog-article";
import { BlogCopyArticle } from "@/components/blog-copy-article";
import { BlogPostSidebar } from "@/components/blog-post-sidebar";
import {
  formatBlogDate,
  getNotraBlogPostBySlug,
  listNotraBlogPosts,
} from "@/utils/blog";
import {
  buildBlogArticleJsonLd,
  buildBlogFaqJsonLd,
} from "@/utils/blog-jsonld";
import { extractBlogToc } from "@/utils/blog-toc";
import { blogPostTitleTransitionName } from "@/utils/blog-view-transitions";
import { highlightCodeBlocks } from "@/utils/highlight-code";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { getReadingTimeMinutes } from "@/utils/reading-time";
import { SITE_URL } from "@/utils/urls";
import type { BlogEntryPageProps } from "~types/blog";

export const revalidate = 3000;

export async function generateStaticParams() {
  const posts = await listNotraBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogEntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNotraBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title: { absolute: post.title },
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      siteName: "Notra",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}

export default async function BlogEntryPage({ params }: BlogEntryPageProps) {
  const { slug } = await params;
  const post = await getNotraBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const url = `${SITE_URL}/blog/${slug}`;
  const markdownUrl = `${SITE_URL}/blog/${slug}.md`;
  const imageUrl = `${SITE_URL}${DEFAULT_SOCIAL_IMAGE.url}`;
  const { html: htmlWithIds, toc } = extractBlogToc(post.content);
  const content = await highlightCodeBlocks(htmlWithIds);
  const readingMinutes = getReadingTimeMinutes(post.markdown);
  const articleJsonLd = buildBlogArticleJsonLd({ post, url, imageUrl });
  const faqJsonLd = buildBlogFaqJsonLd(post);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url },
  ]);

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is server-built and script-close-escaped
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is server-built and script-close-escaped
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />
      {faqJsonLd ? (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is server-built and script-close-escaped
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
          type="application/ld+json"
        />
      ) : null}

      <div className="grid w-full grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="min-w-0 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24">
          <ViewTransition name="blog-back-button">
            <Link
              className="group mb-6 inline-flex items-center gap-2 font-mono text-neutral-500 text-sm transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              href="/blog"
            >
              <HugeiconsIcon
                className="group-hover:-translate-x-0.5 size-4 transition-transform"
                icon={ArrowLeft02Icon}
                strokeWidth={2}
              />
              Back to blog
            </Link>
          </ViewTransition>

          <time className="block font-mono text-neutral-700 text-sm dark:text-neutral-200">
            Published {formatBlogDate(post.createdAt)}
          </time>

          <ViewTransition name={blogPostTitleTransitionName(slug)}>
            <h1 className="mt-6 max-w-3xl text-balance font-sans font-semibold text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              {post.title}
            </h1>
          </ViewTransition>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-border border-b pb-6">
            <span className="font-mono text-neutral-700 text-sm dark:text-neutral-200">
              {readingMinutes} min read
            </span>

            <BlogCopyArticle
              markdown={post.markdown}
              markdownUrl={markdownUrl}
              title={post.title}
            />
          </div>

          <BlogArticle html={content} />
        </article>

        <BlogPostSidebar authors={post.authors} toc={toc} />
      </div>
    </>
  );
}
