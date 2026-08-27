"use client";

import { GlobalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { GEO_WRITE_SITEMAP_SKELETON_KEYS } from "@/constants/geo";
import { useCreateSitemap } from "@/lib/hooks/use-brand-sitemaps";
import {
  getRegistrableHost,
  isUrlWithinBrandHost,
  normalizeSitemapUrl,
} from "@/lib/sitemap/sitemap-url";
import type { WriteSitemapSectionProps } from "@/types/components/geo-writer";
import type { Sitemap } from "@/types/hooks/brand-sitemaps";

import { WriteOptionCard } from "./write-option-card";

function sitemapSummary(sitemap: Sitemap): string {
  if (sitemap.status === "failed") {
    return "Crawl failed";
  }
  if (sitemap.status === "ready") {
    return `${sitemap.indexedPages} pages indexed`;
  }
  return "Crawling pages";
}

export function WriteSitemapSection({
  organizationId,
  brandVoiceId,
  voiceName,
  voiceWebsiteUrl,
  brandIdentityHref,
  sitemaps,
  isPending,
  selectedSitemapId,
  onSelect,
}: WriteSitemapSectionProps) {
  const [url, setUrl] = useState("");
  const createSitemap = useCreateSitemap(organizationId, brandVoiceId ?? "");

  if (!brandVoiceId) {
    return (
      <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-sm">
        Sitemaps belong to a brand identity. Pick one above first.
      </p>
    );
  }

  const ownerName = voiceName ?? "this brand identity";
  const ownerLine = (
    <p className="text-muted-foreground text-sm">
      These sitemaps belong to{" "}
      <span className="text-foreground font-medium">{ownerName}</span>.{" "}
      <Link
        className="text-foreground font-medium underline underline-offset-2"
        href={brandIdentityHref}
      >
        Manage in brand identity
      </Link>
    </p>
  );

  if (isPending) {
    return (
      <div className="space-y-3">
        {ownerLine}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GEO_WRITE_SITEMAP_SKELETON_KEYS.map((key) => (
            <Skeleton className="h-12 rounded-lg" key={key} />
          ))}
        </div>
      </div>
    );
  }

  const brandHost = getRegistrableHost(voiceWebsiteUrl ?? "");
  const trimmedUrl = url.trim();
  const isOffHost =
    trimmedUrl.length > 0 && !isUrlWithinBrandHost(trimmedUrl, voiceWebsiteUrl);
  const canAdd =
    trimmedUrl.length > 0 && !isOffHost && !createSitemap.isPending;

  const handleAdd = async () => {
    if (!canAdd) {
      return;
    }
    try {
      const sitemap = await createSitemap.mutateAsync({
        url: normalizeSitemapUrl(trimmedUrl),
      });
      setUrl("");
      onSelect(sitemap.id);
      toast.success("Sitemap added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add sitemap"
      );
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd().catch(() => undefined);
    }
  };

  return (
    <div className="space-y-3">
      {ownerLine}
      {sitemaps.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sitemaps.map((sitemap) => (
            <WriteOptionCard
              compact
              description={sitemapSummary(sitemap)}
              icon={
                <HugeiconsIcon
                  className="text-muted-foreground size-5"
                  icon={GlobalIcon}
                  strokeWidth={1.8}
                />
              }
              key={sitemap.id}
              label={sitemap.label}
              onToggle={() => onSelect(sitemap.id)}
              selected={sitemap.id === selectedSitemapId}
            />
          ))}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            aria-invalid={isOffHost}
            aria-label="Sitemap or site URL"
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              brandHost
                ? `https://${brandHost}/sitemap.xml`
                : "https://example.com/sitemap.xml"
            }
            value={url}
          />
          <Button
            disabled={!canAdd}
            onClick={() => {
              handleAdd().catch(() => undefined);
            }}
            variant="outline"
          >
            {createSitemap.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            {sitemaps.length > 0 ? "Add another" : "Add sitemap"}
          </Button>
        </div>
        {isOffHost ? (
          <p className="text-destructive text-xs">
            {brandHost
              ? `URLs must stay on ${brandHost} or its subdomains.`
              : "Set a website on this brand identity first."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
