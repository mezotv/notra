"use client";

import { LinkSquare02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@notra/ui/components/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@notra/ui/components/ui/pagination";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { useSitemapPages } from "@/lib/hooks/use-brand-sitemaps";
import {
  formatTextRatio,
  formatWordCount,
  getStatusCodeClassName,
} from "@/lib/sitemap/display";
import {
  formatRelativeCrawlTime,
  getSafeHttpUrl,
} from "@/lib/sitemap/sitemap-url";
import { cn } from "@/lib/utils";
import type {
  SitemapPage,
  SitemapPageCategory,
  SitemapPagesTableProps,
} from "@/types/hooks/brand-sitemaps";
import { getPageNumbers } from "@/utils/content-preview";
import {
  PAGE_FILTER_TABS,
  SITEMAP_PAGE_SKELETON_KEYS,
  SITEMAP_PAGES_PER_PAGE,
} from "../constants/sitemap-ui";

export function SitemapPagesTable({
  sitemapId,
  organizationId,
  voiceId,
}: SitemapPagesTableProps) {
  const { data, isPending } = useSitemapPages(
    organizationId,
    voiceId,
    sitemapId
  );
  const [activeFilter, setActiveFilter] =
    useState<SitemapPageCategory>("crawled");
  const [search, setSearch] = useState("");
  const [rawPage, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
  );

  const handleFilterChange = (filter: SitemapPageCategory) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const pages = data?.pages ?? [];

  const countsByCategory = (() => {
    const counts: Record<SitemapPageCategory, number> = {
      crawled: 0,
      redirect: 0,
      queued: 0,
      failed: 0,
    };
    for (const page of pages) {
      counts[page.category] += 1;
    }
    return counts;
  })();

  const visiblePages = (() => {
    const query = search.trim().toLowerCase();
    return pages.filter((page) => {
      if (page.category !== activeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        page.url.toLowerCase().includes(query) ||
        (page.title?.toLowerCase().includes(query) ?? false)
      );
    });
  })();

  const totalPages = Math.max(
    1,
    Math.ceil(visiblePages.length / SITEMAP_PAGES_PER_PAGE)
  );
  const currentPage = Math.min(Math.max(1, rawPage), totalPages);
  const paginatedPages = visiblePages.slice(
    (currentPage - 1) * SITEMAP_PAGES_PER_PAGE,
    currentPage * SITEMAP_PAGES_PER_PAGE
  );

  if (isPending) {
    return (
      <div className="space-y-3">
        {SITEMAP_PAGE_SKELETON_KEYS.map((key) => (
          <Skeleton className="h-12 w-full" key={key} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="h-9 sm:max-w-80">
          <InputGroupAddon>
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
              icon={Search01Icon}
            />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search sitemap URLs"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search URLs..."
            value={search}
          />
        </InputGroup>

        <div className="flex flex-wrap gap-1.5">
          {PAGE_FILTER_TABS.map((tab) => {
            const isActive = tab.value === activeFilter;
            return (
              <button
                className={cn(
                  "rounded-lg border px-3 py-1.5 font-medium text-xs transition-colors",
                  isActive
                    ? "border-primary bg-muted/60 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/40"
                )}
                key={tab.value}
                onClick={() => handleFilterChange(tab.value)}
                type="button"
              >
                {tab.label} ({countsByCategory[tab.value]})
              </button>
            );
          })}
        </div>
      </div>

      {visiblePages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {search.trim()
              ? "No URLs match your search."
              : "No URLs in this view yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>URL</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-40">Content</TableHead>
                <TableHead className="w-28">Links</TableHead>
                <TableHead className="w-28">Crawled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPages.map((page) => (
                <PageRow key={page.id} page={page} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(Math.max(1, currentPage - 1));
                }}
              />
            </PaginationItem>
            {getPageNumbers(currentPage, totalPages).map(
              (pageNumber, index, pages) =>
                pageNumber === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${pages[index - 1]}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
            )}
            <PaginationItem>
              <PaginationNext
                className={cn(
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(Math.min(totalPages, currentPage + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function PageRow({ page }: { page: SitemapPage }) {
  const textRatio = formatTextRatio(page.textRatio);
  const safeUrl = getSafeHttpUrl(page.url);

  return (
    <TableRow>
      <TableCell className="max-w-0">
        <div className="flex items-start gap-2">
          <HugeiconsIcon
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            icon={LinkSquare02Icon}
          />
          <div className="min-w-0">
            {safeUrl ? (
              <a
                className="block truncate font-medium text-primary text-sm hover:underline"
                href={safeUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {page.path}
              </a>
            ) : (
              <span className="block truncate font-medium text-sm">
                {page.path}
              </span>
            )}
            <p className="truncate text-muted-foreground text-xs">
              {page.category === "redirect" && page.redirectTarget
                ? `→ ${page.redirectTarget}`
                : (page.title ?? page.url)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {page.statusCode === null ? (
          <Badge variant="secondary">Queued</Badge>
        ) : (
          <span
            className={cn(
              "font-medium text-sm tabular-nums",
              getStatusCodeClassName(page.statusCode)
            )}
          >
            {page.statusCode}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">{formatWordCount(page.wordCount)}</div>
        {textRatio ? (
          <div className="text-muted-foreground text-xs">{textRatio}</div>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm tabular-nums">
        {page.internalLinks === null && page.externalLinks === null
          ? "—"
          : `${page.internalLinks ?? 0} int / ${page.externalLinks ?? 0} ext`}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatRelativeCrawlTime(page.crawledAt)}
      </TableCell>
    </TableRow>
  );
}
