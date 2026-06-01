import type { Document, SearchData } from "@mendable/firecrawl-js";

export interface FirecrawlErrorDetail {
  code: string;
  path: string[];
  message: string;
}

export interface FirecrawlWebSearchInput {
  query: string;
  limit?: number;
  sources?: ("web" | "images" | "news")[];
  categories?: { type: "github" | "research" | "pdf" }[];
  includeDomains?: string[];
  excludeDomains?: string[];
  tbs?: string;
  location?: string;
  timeout?: number;
  ignoreInvalidURLs?: boolean;
  scrapeOptions?: {
    formats?: (
      | "markdown"
      | "html"
      | "rawHtml"
      | "links"
      | "images"
      | "summary"
    )[];
    onlyMainContent?: boolean;
    maxAge?: number;
  };
}

export type FirecrawlWebSearchResult = SearchData | AsyncIterable<SearchData>;

export interface FirecrawlWebSearchResponse {
  success: true;
  data: SearchData;
}

export type FirecrawlScrapeDocument = Omit<Document, "json"> & {
  json?: unknown;
};

export type FirecrawlScrapingResult =
  | { success: true; content: string }
  | { success: false; error: string; fatal: boolean };
