import { searchWeb } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
import { webSearchInputSchema } from "../../../lib/schemas/research-tools";
import { withTransientRetry } from "../../../lib/utils/retry";

export default defineTool({
  description:
    "Search the web via context.dev. Use to find a company's domain, LinkedIn page, press coverage, or competitors.",
  inputSchema: webSearchInputSchema,
  async execute({ query, limit }) {
    const response = await withTransientRetry(
      () => searchWeb({ query, limit }),
      { operationName: `Context.dev web search for ${query}` }
    );
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
