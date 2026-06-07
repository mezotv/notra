import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/article-layout";
import {
  formatBlogDate,
  getNotraBlogPostBySlug,
  getNotraBlogPostPagination,
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
  const readingMinutes = getReadingTimeMinutes(post.markdown);
  const [content, { previous, next }] = await Promise.all([
    highlightCodeBlocks(htmlWithIds),
    getNotraBlogPostPagination(slug),
  ]);
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

      <ArticleLayout
        authors={post.authors}
        backHref="/blog"
        backLabel="Back to blog"
        backTransitionName="blog-back-button"
        contentHtml={content}
        copy={{
          markdown: post.markdown,
          markdownUrl,
          title: post.title,
        }}
        dateLabel={`Published ${formatBlogDate(post.createdAt)}`}
        dateTime={post.createdAt}
        pagination={{ previous, next }}
        readingMinutes={readingMinutes}
        title={post.title}
        titleTransitionName={blogPostTitleTransitionName(slug)}
        toc={toc}
      />
    </>
  );
}
