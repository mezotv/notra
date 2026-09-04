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
            <p className="text-muted-foreground text-sm font-medium">
              Indexed Pages
            </p>
            <HugeiconsIcon
              className="text-muted-foreground size-4"
              icon={CheckmarkCircle02Icon}
            />
          </div>
          <p className="text-3xl font-bold tabular-nums">
            {indexedPages}
            <span className="text-muted-foreground ml-1 text-base font-normal">
              / {totalPages}
            </span>
          </p>
          <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-success h-full"
              style={{ width: `${successPercent}%` }}
            />
            <div
              className="bg-destructive h-full"
              style={{ width: `${failedPercent}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-success">Successful: {indexedPages}</span>
            <span className="text-destructive">Failed: {failedPages}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">
              Crawl Status
            </p>
            <HugeiconsIcon
              className="text-muted-foreground size-4"
              icon={Clock01Icon}
            />
          </div>
          <p className="flex items-center gap-2 text-2xl font-semibold">
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
            <p className="text-muted-foreground text-sm font-medium">
              Coverage
            </p>
            <HugeiconsIcon
              className="text-muted-foreground size-4"
              icon={GlobalIcon}
            />
          </div>
          <p className="text-3xl font-bold tabular-nums">{totalPages}</p>
          <p className="text-muted-foreground text-sm">
            {accountedPages} of {totalPages} URLs processed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
