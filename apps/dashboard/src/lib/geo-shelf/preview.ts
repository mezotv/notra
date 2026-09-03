import { fetchWebpage } from "@notra/ai/utils/context-dev";

import {
  GEO_SHELF_PREVIEW_CACHE_MS,
  GEO_SHELF_PREVIEW_TIMEOUT_MS,
  GEO_SHELF_TITLE_MAX_LENGTH,
} from "@/constants/geo-shelf";
import { canonicalizeShelfUrl, shelfDomainFromUrl } from "@/lib/geo-shelf/url";
import type { GeoShelfPreview } from "@/types/geo-shelf";

const WHITESPACE_RUN = /\s+/g;

function cleanTitle(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const collapsed = value.replace(WHITESPACE_RUN, " ").trim();
  if (collapsed.length === 0) {
    return null;
  }
  return collapsed.slice(0, GEO_SHELF_TITLE_MAX_LENGTH);
}

function cleanDescription(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const collapsed = value.replace(WHITESPACE_RUN, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function hasContextDevKey(): boolean {
  return Boolean(process.env.CONTEXT_DEV_API_KEY?.trim());
}

export async function previewGeoShelfUrl(
  rawUrl: string
): Promise<GeoShelfPreview> {
  const url = canonicalizeShelfUrl(rawUrl);
  const domain = shelfDomainFromUrl(url);
  const unavailable: GeoShelfPreview = {
    url,
    finalUrl: null,
    domain,
    title: null,
    description: null,
    available: false,
  };

  if (!hasContextDevKey()) {
    return unavailable;
  }

  try {
    const page = await fetchWebpage({
      url: rawUrl.trim(),
      includeImages: false,
      includeLinks: false,
      onlyMainContent: true,
      maxAgeMs: GEO_SHELF_PREVIEW_CACHE_MS,
      timeoutMS: GEO_SHELF_PREVIEW_TIMEOUT_MS,
    });
    return {
      url,
      finalUrl: page.metadata?.finalUrl ?? page.url ?? null,
      domain,
      title: cleanTitle(page.metadata?.title),
      description: cleanDescription(page.metadata?.description),
      available: true,
    };
  } catch (error) {
    console.warn("[GEO] shelf preview failed", {
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return unavailable;
  }
}
