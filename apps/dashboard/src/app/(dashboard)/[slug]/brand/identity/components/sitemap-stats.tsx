"use client";

import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  GlobalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@notra/ui/components/ui/card";
import { formatRelativeCrawlTime } from "@/lib/sitemap/sitemap-url";
import type { SitemapStatsProps } from "@/types/hooks/brand-sitemaps";
import { SITEMAP_STATUS_META } from "../constants/sitemap-ui";

export function SitemapStats({ sitemap }: SitemapStatsProps) {
  const { indexedPages, failedPages, totalPages } = sitemap;
  const accountedPages = indexedPages + failedPages;
  const successPercent = totalPages > 0 ? (indexedPages / totalPages) * 100 : 0;
  const failedPercent = totalPages > 0 ? (failedPages / totalPages) * 100 : 0;
  const statusMeta = SITEMAP_STATUS_META[sitemap.status];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-muted-foreground text-sm">
              Indexed Pages
            </p>
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
              icon={CheckmarkCircle02Icon}
            />
          </div>
          <p className="font-bold text-3xl tabular-nums">
            {indexedPages}
            <span className="ml-1 font-normal text-base text-muted-foreground">
              / {totalPages}
            </span>
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${successPercent}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${failedPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">
              Successful: {indexedPages}
            </span>
            <span className="text-red-600 dark:text-red-400">
              Failed: {failedPages}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-muted-foreground text-sm">
              Crawl Status
            </p>
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
              icon={Clock01Icon}
            />
          </div>
          <p className="flex items-center gap-2 font-semibold text-2xl">
            <span
              className={`size-2.5 rounded-full ${statusMeta.dotClassName}`}
            />
            {statusMeta.label}
          </p>
          <p className="text-muted-foreground text-sm">
            {sitemap.lastCrawledAt
              ? `Last crawled ${formatRelativeCrawlTime(sitemap.lastCrawledAt)}`
              : "Not crawled yet"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-muted-foreground text-sm">
              Coverage
            </p>
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
              icon={GlobalIcon}
            />
          </div>
          <p className="font-bold text-3xl tabular-nums">{totalPages}</p>
          <p className="text-muted-foreground text-sm">
            {accountedPages} of {totalPages} URLs processed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
