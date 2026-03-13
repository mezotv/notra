import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogHtmlArticle } from "@/components/changelog-html-article";
import { NotraMark } from "@/components/notra-mark";
import {
  formatChangelogDate,
  getNotraChangelogPostBySlug,
} from "@/utils/changelog";
import type { ChangelogEntryPageProps } from "~types/changelog";

export async function generateMetadata({
  params,
}: ChangelogEntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNotraChangelogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const url = `https://usenotra.com/changelog/notra/${slug}`;

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

  return (
    <>
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
