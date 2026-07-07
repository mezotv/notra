import { searchWeb } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export default defineTool({
  description:
    "Search the web via context.dev. Use to find a company's domain, LinkedIn page, press coverage, or competitors.",
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(10).optional(),
  }),
  async execute({ query, limit }) {
    const response = await searchWeb({ query, limit });
    return {
      query: response.query,
      results: response.results.map((result) => ({
        title: result.title,
        url: result.url,
        description: result.description,
      })),
    };
  },
});
