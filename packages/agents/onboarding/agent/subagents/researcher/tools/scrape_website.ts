import { scrapeWebsiteForBrandAnalysis } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export default defineTool({
  description:
    "Scrape a company website's most brand-relevant pages in one call: crawls the sitemap, ranks pages (home, about, product, pricing), and returns their combined markdown. Use scrape_page for a single known URL instead.",
  inputSchema: z.object({
    url: z.string().min(1),
  }),
  async execute({ url }) {
    const result = await scrapeWebsiteForBrandAnalysis(url);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { url, content: result.content };
  },
});
