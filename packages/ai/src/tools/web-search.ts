import Firecrawl, { type SearchRequest } from "@mendable/firecrawl-js";
import { toolDescription } from "@notra/ai/utils/description";
import { type Tool, tool } from "ai";
import z from "zod";

export const WEB_SEARCH_TOOL_NAME = "webSearch";

export function isWebSearchAvailable(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
}

const webSearchInputSchema = z.object({
  query: z.string().min(1).describe("The web search query."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(5)
    .describe("Maximum number of results to return. Prefer 5 by default."),
  sources: z
    .array(z.enum(["web", "images", "news"]))
    .default(["web"])
    .describe("Sources to search. Defaults to web."),
  categories: z
    .array(z.object({ type: z.enum(["github", "research", "pdf"]) }))
    .optional()
    .describe("Optional category filters for GitHub, research, or PDFs."),
  includeDomains: z
    .array(z.string().min(1))
    .optional()
    .describe("Optional list of domains to include."),
  excludeDomains: z
    .array(z.string().min(1))
    .optional()
    .describe("Optional list of domains to exclude."),
  tbs: z
    .string()
    .optional()
    .describe(
      "Optional time filter such as qdr:d, qdr:w, qdr:m, qdr:y, or a custom date range."
    ),
  location: z
    .string()
    .optional()
    .describe("Optional search location, for example San Francisco,CA,US."),
  timeout: z
    .number()
    .int()
    .positive()
    .max(120_000)
    .default(60_000)
    .describe("Search timeout in milliseconds."),
  ignoreInvalidURLs: z
    .boolean()
    .default(false)
    .describe("Exclude URLs that are invalid for other Firecrawl endpoints."),
  scrapeOptions: z
    .object({
      formats: z
        .array(
          z.enum(["markdown", "html", "rawHtml", "links", "images", "summary"])
        )
        .optional(),
      onlyMainContent: z.boolean().optional(),
      maxAge: z.number().int().positive().optional(),
    })
    .optional()
    .describe("Optional scrape options when full page content is needed."),
});

type WebSearchInput = z.infer<typeof webSearchInputSchema>;

export function createWebSearchTool(): Tool {
  return tool({
    description: toolDescription({
      toolName: WEB_SEARCH_TOOL_NAME,
      intro:
        "Search the live web with Firecrawl and return source-aware results.",
      whenToUse:
        "Use when public, current, or external context would improve accuracy, including docs, news, competitors, market context, or fact checking.",
      usageNotes:
        "Prefer limit: 5 for discovery. Use includeDomains, excludeDomains, categories, or tbs when the user asks for a specific source type or time window. Results include titles, URLs, descriptions, and optional scraped content.",
    }),
    inputSchema: webSearchInputSchema,
    execute: async (input) => searchWeb(input),
  });
}

async function searchWeb(input: WebSearchInput) {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is required to use webSearch.");
  }

  const firecrawl = new Firecrawl({ apiKey });
  const { query, ...options } = input;
  const data = await firecrawl.search(
    query,
    options satisfies Omit<SearchRequest, "query">
  );
  return { success: true, data };
}

export const WEB_SEARCH_TOOL_DESCRIPTION =
  "**Web Search**: Search the live web using webSearch for current facts, public docs, news, competitive context, and source-aware research. Prefer limit: 5 unless the user asks for broader coverage. Use result titles, URLs, and descriptions for citations or follow-up research.";
