"use client";

import { GlobalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import type { SitemapSelectorProps } from "@/types/hooks/brand-sitemaps";
import { SITEMAP_STATUS_META } from "../constants/sitemap-ui";

export function SitemapSelector({
  sitemaps,
  selectedSitemapId,
  onSelect,
}: SitemapSelectorProps) {
  if (sitemaps.length <= 1) {
    return null;
  }

  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Sitemap</legend>
      {sitemaps.map((sitemap) => {
        const isSelected = sitemap.id === selectedSitemapId;
        const statusMeta = SITEMAP_STATUS_META[sitemap.status];

        return (
          <label
            className={cn(
              "flex min-w-[12rem] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
              isSelected
                ? "border-primary bg-muted/40"
                : "border-border hover:bg-muted/40"
            )}
            key={sitemap.id}
          >
            <input
              checked={isSelected}
              className="sr-only"
              name="brand-sitemap"
              onChange={() => onSelect(sitemap.id)}
              type="radio"
            />
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <HugeiconsIcon className="size-4" icon={GlobalIcon} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{sitemap.label}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    statusMeta.dotClassName
                  )}
                />
                {sitemap.indexedPages} indexed
              </p>
            </div>
          </label>
        );
      })}
    </fieldset>
  );
}
