import { scrapeWebsiteForBrandAnalysis } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
import { webpageInputSchema } from "../../../lib/schemas/research-tools";
import { ToolOperationError } from "../../../lib/schemas/retry";
import { saveReferenceSnapshot } from "../../../lib/utils/reference-snapshot";
import { withTransientRetry } from "../../../lib/utils/retry";

export default defineTool({
  description:
    "Scrape a company website's most brand-relevant pages in one call: crawls the sitemap, ranks pages (home, about, product, pricing), and returns their combined markdown. Use scrape_page for a single known URL instead.",
  inputSchema: webpageInputSchema,
  async execute({ url }, ctx) {
    const result = await withTransientRetry(
      async () => {
        const attempt = await scrapeWebsiteForBrandAnalysis(url);
        if (!(attempt.success || attempt.fatal)) {
          throw new ToolOperationError({
            cause: new Error(attempt.error),
            operationName: `Context.dev website scrape for ${url}`,
            retryable: true,
          });
        }
        return attempt;
      },
      { operationName: `Context.dev website scrape for ${url}` }
    );
    if (!result.success) {
      throw new Error(result.error);
    }
    const snapshot = await saveReferenceSnapshot({
      ctx,
      markdown: result.content,
    });
    return { url, markdown: result.content, ...(snapshot ?? {}) };
  },
});
