import { crawlSitemap } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { SITEMAP_DEFAULT_MAX_LINKS } from "../../../lib/constants/context-dev";

export default defineTool({
  description:
    "Discover a website's URLs from its sitemap via context.dev. Use to find blog posts, changelog entries, and key pages before scraping. Supports an optional regex filter.",
  inputSchema: z.object({
    domain: z.string().min(1),
    urlRegex: z.string().optional(),
    maxLinks: z
      .number()
      .int()
      .min(1)
      .max(500)
      .default(SITEMAP_DEFAULT_MAX_LINKS),
  }),
  async execute({ domain, urlRegex, maxLinks }) {
    const response = await crawlSitemap({ domain, urlRegex, maxLinks });
    return {
      domain: response.domain,
      urls: response.urls,
    };
  },
});
