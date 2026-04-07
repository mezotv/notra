import type { ReactNode } from "react";

export interface NotraBlogPost {
  id: string;
  title: string;
  content: string;
  markdown: string;
  recommendations: string | null;
  contentType: string;
  sourceMetadata: null;
  status: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  excerpt: string;
}

interface BlogPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
}

export interface BlogTimelineItem {
  id: string;
  title: string;
  description: string;
  href: string;
  date: string;
}

interface BlogTimelineProps {
  items: BlogTimelineItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}

interface BlogHtmlArticleProps {
  html: string;
}

export interface BlogEntryPageProps {
  params: Promise<{ slug: string }>;
}
