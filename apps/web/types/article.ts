import type { TOCItemType } from "fumadocs-core/toc";
import type { ReactNode } from "react";
import type { BlogPostPaginationProps, NotraBlogAuthor } from "~types/blog";

export interface ArticleCopyConfig {
  markdown: string;
  markdownUrl: string;
  title: string;
}

export interface ArticleLayoutProps {
  backHref: string;
  backLabel: string;
  backTransitionName?: string;
  title: string;
  titleTransitionName?: string;
  dateLabel: string;
  dateTime: string;
  readingMinutes: number;
  contentHtml: string;
  toc: TOCItemType[];
  authors: NotraBlogAuthor[];
  byline?: ReactNode;
  copy?: ArticleCopyConfig | null;
  pagination?: BlogPostPaginationProps | null;
}
