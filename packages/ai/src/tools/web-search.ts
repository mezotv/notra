import type { ContextDevWebSearchInput } from "@notra/ai/types/context-dev";
import { searchWeb } from "@notra/ai/utils/context-dev";
import { toolDescription } from "@notra/ai/utils/description";
import { type Tool, tool } from "ai";
import z from "zod";

export const WEB_SEARCH_TOOL_NAME = "webSearch";

export function isWebSearchAvailable(): boolean {
  return true;
}

const webSearchInputSchema: z.ZodType<ContextDevWebSearchInput> = z.object({
  query: z.string().min(1).describe("The web search query."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(5)
    .describe("Maximum number of results to return. Prefer 5 by default."),
  includeDomains: z
    .array(z.string().min(1))
    .optional()
    .describe("Optional list of domains to include."),
  excludeDomains: z
    .array(z.string().min(1))
    .optional()
    .describe("Optional list of domains to exclude."),
  freshness: z
    .enum(["last_24_hours", "last_week", "last_month", "last_year"])
    .optional()
    .describe("Optional freshness window for recently published content."),
  queryFanout: z
    .boolean()
    .optional()
    .describe("Expand the query into parallel variants for broader recall."),
  timeoutMS: z
    .number()
    .int()
    .min(1000)
    .max(300_000)
    .default(60_000)
    .describe("Search timeout in milliseconds."),
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
    .describe("Optional scrape options when full page markdown is needed."),
});

export function createWebSearchTool(): Tool {
  return tool({
    description: toolDescription({
      toolName: WEB_SEARCH_TOOL_NAME,
      intro:
        "Search the live web with Context.dev and return source-aware results.",
      whenToUse:
        "Use when public, current, or external context would improve accuracy, including docs, news, competitors, market context, or fact checking.",
      usageNotes:
        "Prefer limit: 5 for discovery. Use includeDomains, excludeDomains, freshness, or scrapeOptions when the user asks for a specific source type, time window, or full page content. Results include titles, URLs, descriptions, and optional scraped markdown.",
    }),
    inputSchema: webSearchInputSchema,
    execute: async (input) => searchWeb(input),
  });
}

export const WEB_SEARCH_TOOL_DESCRIPTION =
  "**Web Search**: Search the live web using webSearch for current facts, public docs, news, competitive context, and source-aware research. Prefer limit: 5 unless the user asks for broader coverage. Use result titles, URLs, descriptions, and scraped markdown for citations or follow-up research.";
