export interface ContextDevErrorResponse {
  message?: string;
  error_code?: string;
}

export interface ContextDevMarkdownOptions {
  enabled?: boolean;
  includeLinks?: boolean;
  includeImages?: boolean;
  shortenBase64Images?: boolean;
  useMainContentOnly?: boolean;
  includeFrames?: boolean;
  maxAgeMs?: number;
  waitForMs?: number;
  timeoutMS?: number;
}

export interface ContextDevWebSearchInput {
  query: string;
  limit?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  freshness?: "last_24_hours" | "last_week" | "last_month" | "last_year";
  queryFanout?: boolean;
  timeoutMS?: number;
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

export interface ContextDevSearchResult {
  url: string;
  title: string;
  description: string;
  relevance: "high" | "medium" | "low";
  markdown: {
    markdown: string | null;
    code:
      | "SUCCESS"
      | "NOT_REQUESTED"
      | "TIMEOUT"
      | "WEBSITE_ACCESS_ERROR"
      | "ERROR";
  };
}

export interface ContextDevSearchResponse {
  query: string;
  results: ContextDevSearchResult[];
}

export interface ContextDevWebSearchResponse {
  success: true;
  data: {
    web: ContextDevSearchResult[];
  };
  results: ContextDevSearchResult[];
  query: string;
}

export type ContextDevScrapingResult =
  | { success: true; content: string }
  | { success: false; error: string; fatal: boolean };
