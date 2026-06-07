import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { ViewTransition } from "react";
import { BlogArticle } from "@/components/blog-article";
import { BlogCopyArticle } from "@/components/blog-copy-article";
import { BlogPostPagination } from "@/components/blog-post-pagination";
import { BlogPostSidebar } from "@/components/blog-post-sidebar";
import type { ArticleLayoutProps } from "~types/article";

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="group mb-6 inline-flex items-center gap-2 font-mono text-neutral-500 text-sm transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
      href={href}
    >
      <HugeiconsIcon
        className="group-hover:-translate-x-0.5 size-4 transition-transform"
        icon={ArrowLeft02Icon}
        strokeWidth={2}
      />
      {label}
    </Link>
  );
}

export function ArticleLayout({
  backHref,
  backLabel,
  backTransitionName,
  title,
  titleTransitionName,
  dateLabel,
  dateTime,
  readingMinutes,
  contentHtml,
  toc,
  authors,
  byline,
  copy,
  pagination,
}: ArticleLayoutProps) {
  const titleNode = (
    <h1 className="mt-6 max-w-3xl text-balance font-sans font-semibold text-4xl leading-[1.05] tracking-tight sm:text-5xl">
      {title}
    </h1>
  );

  return (
    <div className="grid w-full grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24">
        {backTransitionName ? (
          <ViewTransition name={backTransitionName}>
            <BackLink href={backHref} label={backLabel} />
          </ViewTransition>
        ) : (
          <BackLink href={backHref} label={backLabel} />
        )}

        <time
          className="block font-mono text-neutral-700 text-sm dark:text-neutral-200"
          dateTime={dateTime}
        >
          {dateLabel}
        </time>

        {titleTransitionName ? (
          <ViewTransition name={titleTransitionName}>
            {titleNode}
          </ViewTransition>
        ) : (
          titleNode
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-border border-b pb-6">
          <span className="font-mono text-neutral-700 text-sm dark:text-neutral-200">
            {readingMinutes} min read
          </span>

          {copy ? (
            <BlogCopyArticle
              markdown={copy.markdown}
              markdownUrl={copy.markdownUrl}
              title={copy.title}
            />
          ) : null}
        </div>

        {byline ? <div className="mt-6">{byline}</div> : null}

        <BlogArticle html={contentHtml} />

        {pagination ? (
          <BlogPostPagination
            next={pagination.next}
            previous={pagination.previous}
          />
        ) : null}
      </article>

      <BlogPostSidebar authors={authors} toc={toc} />
    </div>
  );
}
