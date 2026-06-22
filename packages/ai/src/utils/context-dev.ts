import type {
  ContextDevErrorResponse,
  ContextDevFetchWebpageInput,
  ContextDevFetchWebpageResponse,
  ContextDevScrapingResult,
  ContextDevSearchResponse,
  ContextDevSearchResult,
  ContextDevWebSearchInput,
  ContextDevWebSearchResponse,
} from "@notra/ai/types/context-dev";

const CONTEXT_DEV_API_BASE_URL = "https://api.context.dev/v1";
const BRAND_ANALYSIS_MAX_CONTENT_LENGTH = 80_000;

class ContextDevApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.code = code;
    this.name = "ContextDevApiError";
    this.status = status;
  }
}

function getContextDevApiKey(): string {
  const apiKey = process.env.CONTEXT_DEV_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CONTEXT_DEV_API_KEY is not configured.");
  }
  return apiKey;
}

async function parseContextDevError(response: Response) {
  let payload: ContextDevErrorResponse | undefined;
  try {
    payload = (await response.json()) as ContextDevErrorResponse;
  } catch {
    payload = undefined;
  }

  throw new ContextDevApiError(
    payload?.message || `Context.dev request failed with ${response.status}`,
    response.status,
    payload?.error_code
  );
}

async function requestContextDev<TResponse>(
  path: string,
  init: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${CONTEXT_DEV_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getContextDevApiKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    await parseContextDevError(response);
  }

  return (await response.json()) as TResponse;
}

function truncateContent(content: string): string {
  if (content.length <= BRAND_ANALYSIS_MAX_CONTENT_LENGTH) {
    return content;
  }

  return `${content.slice(0, BRAND_ANALYSIS_MAX_CONTENT_LENGTH)}\n\n[Content truncated for brand analysis]`;
}

function mapContextDevError(error: unknown): ContextDevScrapingResult {
  if (error instanceof ContextDevApiError) {
    if (
      error.code === "INPUT_VALIDATION_ERROR" ||
      error.message.includes("Invalid URL")
    ) {
      return { success: false, error: "Invalid URL", fatal: true };
    }

    if (
      error.status === 403 ||
      error.status === 404 ||
      error.status === 415 ||
      error.code === "WEBSITE_ACCESS_ERROR" ||
      error.code === "UNSUPPORTED_CONTENT" ||
      error.code === "NOT_FOUND"
    ) {
      return {
        success: false,
        error:
          error.code === "NOT_FOUND"
            ? "Website URL not found"
            : "Unsupported website URL",
        fatal: true,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to scrape website",
      fatal: false,
    };
  }

  return {
    success: false,
    error:
      error instanceof Error
        ? error.message
        : "Unknown error attempting to scrape website",
    fatal: false,
  };
}

export async function scrapeWebsiteForBrandAnalysis(
  url: string
): Promise<ContextDevScrapingResult> {
  try {
    const response = await fetchWebpage({
      includeImages: false,
      includeLinks: true,
      onlyMainContent: true,
      url,
    });

    return { success: true, content: truncateContent(response.markdown) };
  } catch (error) {
    console.error("Error scraping website:", error);
    return mapContextDevError(error);
  }
}

export async function fetchWebpage(
  input: ContextDevFetchWebpageInput
): Promise<ContextDevFetchWebpageResponse> {
  const params = new URLSearchParams({
    includeImages: String(input.includeImages ?? false),
    includeLinks: String(input.includeLinks ?? true),
    shortenBase64Images: "true",
    useMainContentOnly: String(input.onlyMainContent ?? true),
    url: input.url,
  });

  if (input.maxAgeMs !== undefined) {
    params.set("maxAgeMs", String(input.maxAgeMs));
  }
  if (input.waitForMs !== undefined) {
    params.set("waitForMs", String(input.waitForMs));
  }
  if (input.timeoutMS !== undefined) {
    params.set("timeoutMS", String(input.timeoutMS));
  }

  const response = await requestContextDev<{
    markdown: string;
    metadata?: ContextDevFetchWebpageResponse["metadata"];
    url: string;
  }>(`/web/scrape/markdown?${params.toString()}`, { method: "GET" });

  return {
    success: true,
    markdown: response.markdown,
    metadata: response.metadata,
    url: response.url,
  };
}

function shouldScrapeMarkdown(input: ContextDevWebSearchInput): boolean {
  return Boolean(input.scrapeOptions?.formats?.includes("markdown"));
}

function toMaxAgeMs(maxAge?: number) {
  return typeof maxAge === "number" ? maxAge : undefined;
}

function normalizeSearchResult(
  result: ContextDevSearchResult
): ContextDevSearchResult {
  return {
    ...result,
    markdown: result.markdown ?? {
      code: "NOT_REQUESTED",
      markdown: null,
    },
  };
}

export async function searchWeb(
  input: ContextDevWebSearchInput
): Promise<ContextDevWebSearchResponse> {
  const response = await requestContextDev<ContextDevSearchResponse>(
    "/web/search",
    {
      body: JSON.stringify({
        query: input.query,
        includeDomains: input.includeDomains,
        excludeDomains: input.excludeDomains,
        freshness: input.freshness,
        queryFanout: input.queryFanout,
        timeoutMS: input.timeoutMS,
        markdownOptions: {
          enabled: shouldScrapeMarkdown(input),
          includeLinks: true,
          includeImages:
            input.scrapeOptions?.formats?.includes("images") ?? false,
          shortenBase64Images: true,
          useMainContentOnly: input.scrapeOptions?.onlyMainContent ?? true,
          maxAgeMs: toMaxAgeMs(input.scrapeOptions?.maxAge),
        },
      }),
      method: "POST",
    }
  );

  const results = response.results
    .slice(0, input.limit ?? 5)
    .map(normalizeSearchResult);
  return {
    success: true,
    data: { web: results },
    results,
    query: response.query,
  };
}
