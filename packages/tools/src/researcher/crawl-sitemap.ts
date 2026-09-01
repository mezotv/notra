import { crawlSitemap } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";

import { crawlSitemapInputSchema } from "../schemas/research-tools";
import { withTransientRetry } from "../utils/retry";

export function createCrawlSitemapTool() {
  return defineTool({
    description:
      "Discover a website's URLs from its sitemap via context.dev. Use to find blog posts, changelog entries, and key pages before scraping. Supports an optional regex filter.",
    inputSchema: crawlSitemapInputSchema,
    async execute({ domain, urlRegex, maxLinks }) {
      const response = await withTransientRetry(
        () => crawlSitemap({ domain, urlRegex, maxLinks }),
        { operationName: `Context.dev sitemap crawl for ${domain}` }
      );
      return {
        domain: response.domain,
        urls: response.urls,
      };
    },
  });
}
