import type { ReactNode } from "react";

export interface NotraSourceRepository {
  owner: string;
  repo: string;
}

export interface NotraSourceMetadata {
  triggerId: string;
  repositories: NotraSourceRepository[];
  lookbackRange: {
    start: string;
    end: string;
  };
  lookbackWindow: string;
  triggerSourceType: string;
}

export interface NotraChangelogPost {
  id: string;
  title: string;
  content: string;
  markdown: string;
  recommendations: string | null;
  contentType: string;
  sourceMetadata: NotraSourceMetadata | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  excerpt: string;
}

export interface ChangelogPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  meta?: ReactNode;
}

export interface ChangelogTimelineItem {
  id: string;
  title: string;
  description: string;
  href: string;
  date: string;
}

export interface ChangelogTimelineProps {
  items: ChangelogTimelineItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface ChangelogHtmlArticleProps {
  html: string;
}

export interface ChangelogEntryPageProps {
  params: Promise<{ slug: string }>;
}
