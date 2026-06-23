import { SITEMAP_PAGES_FETCH_LIMIT } from "@/constants/sitemap";
import type {
  SitemapPage,
  SitemapPagesResponse,
} from "@/types/hooks/brand-sitemaps";

export async function fetchSitemapJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchAllSitemapPages(
  organizationId: string,
  voiceId: string,
  sitemapId: string
): Promise<SitemapPagesResponse> {
  const basePath = `/api/organizations/${organizationId}/brand-identities/${voiceId}/sitemaps/${sitemapId}/pages`;
  const pages: SitemapPage[] = [];
  let counts: SitemapPagesResponse["counts"];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: String(SITEMAP_PAGES_FETCH_LIMIT),
    });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const result = await fetchSitemapJson<SitemapPagesResponse>(
      `${basePath}?${params.toString()}`
    );

    for (const page of result.pages) {
      pages.push(page);
    }
    counts = result.counts;
    cursor = result.hasMore ? (result.nextCursor ?? undefined) : undefined;
  } while (cursor);

  return { counts, pages };
}
