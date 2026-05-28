import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog-article";
import { BlogCopyArticle } from "@/components/blog-copy-article";
import { getAuthorHref } from "@/utils/authors";
import {
  formatBlogDate,
  getNotraBlogPostBySlug,
  listNotraBlogPosts,
} from "@/utils/blog";
import {
  buildBlogArticleJsonLd,
  buildBlogFaqJsonLd,
} from "@/utils/blog-jsonld";
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
  const content = await highlightCodeBlocks(post.content);
  const readingMinutes = getReadingTimeMinutes(post.markdown);
  const author = post.authors.at(0) ?? null;
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

      <time className="block font-mono text-foreground/40 text-sm">
        Published {formatBlogDate(post.createdAt)}
      </time>

      <h1 className="mt-6 max-w-3xl text-balance font-sans font-semibold text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        {post.title}
      </h1>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-border border-b pb-6">
        <div className="flex items-center gap-3 font-mono text-foreground/50 text-sm">
          <span>{readingMinutes} min read</span>
          {author ? (
            <>
              <span aria-hidden="true">&middot;</span>
              <Link
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                href={getAuthorHref(author.slug)}
              >
                <Avatar size="sm">
                  {author.image ? (
                    <AvatarImage alt={author.name} src={author.image} />
                  ) : null}
                  <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{author.name}</span>
              </Link>
            </>
          ) : null}
        </div>

        <BlogCopyArticle
          markdown={post.markdown}
          markdownUrl={markdownUrl}
          title={post.title}
        />
      </div>

      <BlogArticle html={content} />
    </>
  );
}
