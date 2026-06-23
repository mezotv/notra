import type {
  SitemapPageCategory,
  SitemapStatus,
} from "@/types/hooks/brand-sitemaps";

export const SITEMAP_STATUS_META: Record<
  SitemapStatus,
  { label: string; dotClassName: string }
> = {
  queued: { label: "Queued", dotClassName: "bg-muted-foreground" },
  crawling: { label: "Crawling", dotClassName: "bg-blue-500" },
  ready: { label: "Ready", dotClassName: "bg-emerald-500" },
  failed: { label: "Failed", dotClassName: "bg-red-500" },
};

export const PAGE_FILTER_TABS: {
  value: SitemapPageCategory;
  label: string;
}[] = [
  { value: "crawled", label: "Crawled Pages" },
  { value: "redirect", label: "Redirects" },
  { value: "queued", label: "Queued" },
  { value: "failed", label: "Failed" },
];

export const SITEMAP_STAT_SKELETON_KEYS = [
  "total-pages",
  "indexed-pages",
  "failed-pages",
];

export const SITEMAP_PAGE_SKELETON_KEYS = [
  "page-row-1",
  "page-row-2",
  "page-row-3",
  "page-row-4",
];

export const SITEMAP_PAGES_PER_PAGE = 25;
