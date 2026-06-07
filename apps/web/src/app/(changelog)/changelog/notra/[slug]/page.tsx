import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/article-layout";
import { extractBlogToc } from "@/utils/blog-toc";
import { changelogPostTitleTransitionName } from "@/utils/blog-view-transitions";
import {
  formatChangelogDate,
  getNotraChangelogPostBySlug,
  getNotraChangelogPostPagination,
  listNotraChangelogPosts,
} from "@/utils/changelog";
import { highlightCodeBlocks } from "@/utils/highlight-code";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { getReadingTimeMinutes } from "@/utils/reading-time";
import { SITE_URL } from "@/utils/urls";
import type { ChangelogEntryPageProps } from "~types/changelog";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await listNotraChangelogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ChangelogEntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNotraChangelogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const url = `${SITE_URL}/changelog/notra/${slug}`;

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
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [DEFAULT_SOCIAL_IMAGE.url],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}

export default async function ChangelogEntryPage({
  params,
}: ChangelogEntryPageProps) {
  const { slug } = await params;
  const post = await getNotraChangelogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const url = `${SITE_URL}/changelog/notra/${slug}`;
  const markdownUrl = `${SITE_URL}/changelog/notra/${slug}.md`;
  const { html: htmlWithIds, toc } = extractBlogToc(post.content);
  const readingMinutes = getReadingTimeMinutes(post.markdown);
  const [content, { previous, next }] = await Promise.all([
    highlightCodeBlocks(htmlWithIds),
    getNotraChangelogPostPagination(slug),
  ]);
  const articleJsonLd = buildArticleJsonLd({
    url,
    title: post.title,
    description: post.excerpt,
    imageUrl: `${SITE_URL}${DEFAULT_SOCIAL_IMAGE.url}`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Changelog", url: `${SITE_URL}/changelog` },
    { name: "Notra", url: `${SITE_URL}/changelog/notra` },
    { name: post.title, url },
  ]);

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />

      <ArticleLayout
        authors={post.authors}
        backHref="/changelog/notra"
        backLabel="All updates"
        backTransitionName="changelog-back-button"
        contentHtml={content}
        copy={{ markdown: post.markdown, markdownUrl, title: post.title }}
        dateLabel={`Published ${formatChangelogDate(post.createdAt)}`}
        dateTime={post.createdAt}
        pagination={{ previous, next }}
        readingMinutes={readingMinutes}
        title={post.title}
        titleTransitionName={changelogPostTitleTransitionName(slug)}
        toc={toc}
      />
    </>
  );
}
