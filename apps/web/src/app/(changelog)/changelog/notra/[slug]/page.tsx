import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogHtmlArticle } from "@/components/changelog-html-article";
import { NotraMark } from "@/components/notra-mark";
import {
  formatChangelogDate,
  getNotraChangelogPostBySlug,
} from "@/utils/changelog";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";
import type { ChangelogEntryPageProps } from "~types/changelog";

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
      <Link
        className="mb-6 inline-flex items-center gap-1 font-sans text-foreground/50 text-sm transition-colors hover:text-foreground"
        href="/changelog/notra"
      >
        &larr; All updates
      </Link>

      <h1 className="font-sans font-semibold text-3xl tracking-tight sm:text-4xl">
        {post.title}
      </h1>
      <time className="mt-2 block font-sans text-foreground/40 text-sm">
        {formatChangelogDate(post.createdAt)}
      </time>

      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-primary">
          <NotraMark className="size-3.5 shrink-0" />
        </span>
        <p className="font-sans text-muted-foreground text-xs">
          Published by the Notra team.
        </p>
      </div>

      <ChangelogHtmlArticle html={post.content} />
    </>
  );
}
