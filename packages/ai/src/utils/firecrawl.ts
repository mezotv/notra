import { SdkError } from "@mendable/firecrawl-js";
import type {
  FirecrawlErrorDetail,
  FirecrawlScrapeDocument,
  FirecrawlScrapingResult,
  FirecrawlWebSearchInput,
  FirecrawlWebSearchResponse,
  FirecrawlWebSearchResult,
} from "@notra/ai/types/firecrawl";
import type { ToolExecutionOptions } from "ai";
import { scrape, search } from "firecrawl-aisdk";

const brandAnalysisScrapeTool = scrape();
const webSearchTool = search();

const isFirecrawlUnsupportedMessage = (message?: string | null) => {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return (
    normalized.includes("do not support this site") ||
    normalized.includes("we do not support this site") ||
    normalized.includes("unsupported site") ||
    normalized.includes("unsupported url")
  );
};

const isFirecrawlErrorDetail = (
  detail: unknown
): detail is FirecrawlErrorDetail => {
  if (!(detail && typeof detail === "object")) {
    return false;
  }

  return (
    "message" in detail &&
    typeof detail.message === "string" &&
    "code" in detail &&
    typeof detail.code === "string" &&
    "path" in detail &&
    Array.isArray(detail.path) &&
    detail.path.every((pathItem) => typeof pathItem === "string")
  );
};

const isAsyncIterable = <TItem extends object>(
  value: TItem | AsyncIterable<TItem>
): value is AsyncIterable<TItem> => Symbol.asyncIterator in value;

const resolveScrapeDocument = async (
  result: FirecrawlScrapeDocument | AsyncIterable<FirecrawlScrapeDocument>
): Promise<FirecrawlScrapeDocument> => {
  if (!isAsyncIterable(result)) {
    return result;
  }

  for await (const item of result) {
    return item;
  }

  throw new Error("Firecrawl scrape tool returned no result.");
};

const resolveSearchData = async (
  result: FirecrawlWebSearchResult
): Promise<FirecrawlWebSearchResponse["data"]> => {
  if (!isAsyncIterable(result)) {
    return result;
  }

  for await (const item of result) {
    return item;
  }

  throw new Error("Firecrawl search tool returned no result.");
};

const createDomainScopedQuery = (input: FirecrawlWebSearchInput): string => {
  if (input.includeDomains?.length && input.excludeDomains?.length) {
    throw new Error(
      "includeDomains and excludeDomains cannot both be specified"
    );
  }

  const includeQuery =
    input.includeDomains?.map((domain) => `site:${domain}`).join(" OR ") ?? "";
  const excludeQuery =
    input.excludeDomains?.map((domain) => `-site:${domain}`).join(" ") ?? "";
  return [input.query, includeQuery, excludeQuery].filter(Boolean).join(" ");
};

const mapFirecrawlError = (error: unknown): FirecrawlScrapingResult => {
  if (error instanceof SdkError) {
    const details = Array.isArray(error.details)
      ? error.details.filter(isFirecrawlErrorDetail)
      : [];
    const detailMessages = details.map((detail) => detail.message);

    if (
      detailMessages.includes("Invalid URL") ||
      detailMessages.some((message) =>
        message.includes("valid top-level domain")
      ) ||
      error.message?.includes("Invalid URL") ||
      error.message?.includes("valid top-level domain")
    ) {
      return { success: false, error: "Invalid URL", fatal: true };
    }

    if (
      error.status === 403 ||
      isFirecrawlUnsupportedMessage(error.message) ||
      detailMessages.some((message) => isFirecrawlUnsupportedMessage(message))
    ) {
      return {
        success: false,
        error: "Unsupported website URL",
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
    error: "Unknown error attempting to scrape website",
    fatal: false,
  };
};

export async function scrapeWebsiteForBrandAnalysis(
  url: string
): Promise<FirecrawlScrapingResult> {
  try {
    const execute = brandAnalysisScrapeTool.execute;
    if (!execute) {
      throw new Error("Firecrawl scrape tool is missing an execute function.");
    }

    const result = await resolveScrapeDocument(
      await execute(
        {
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        },
        {
          toolCallId: "brand-analysis-scrape",
          messages: [],
        } satisfies ToolExecutionOptions
      )
    );

    return { success: true, content: result.markdown ?? "" };
  } catch (error) {
    console.error("Error scraping website:", error);
    return mapFirecrawlError(error);
  }
}

export async function searchWeb(
  input: FirecrawlWebSearchInput
): Promise<FirecrawlWebSearchResponse> {
  const execute = webSearchTool.execute;
  if (!execute) {
    throw new Error("Firecrawl search tool is missing an execute function.");
  }

  const data = await resolveSearchData(
    await execute(
      {
        query: createDomainScopedQuery(input),
        limit: input.limit,
        sources: input.sources?.map((type) => ({ type })),
        categories: input.categories,
        tbs: input.tbs,
        location: input.location,
        timeout: input.timeout,
        ignoreInvalidURLs: input.ignoreInvalidURLs,
        scrapeOptions: input.scrapeOptions,
      },
      {
        toolCallId: "web-search",
        messages: [],
      } satisfies ToolExecutionOptions
    )
  );

  return { success: true, data };
}
