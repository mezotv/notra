import { fetchWebpage } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { SCRAPE_MARKDOWN_MAX_LENGTH } from "../../../lib/constants/context-dev";

export default defineTool({
  description:
    "Scrape a web page into clean markdown via context.dev. Use for company websites, blog posts, changelogs, and LinkedIn company pages.",
  inputSchema: z.object({
    url: z.string().min(1),
  }),
  async execute({ url }) {
    const page = await fetchWebpage({ url });
    return {
      url: page.url,
      title: page.metadata?.title ?? null,
      markdown: page.markdown.slice(0, SCRAPE_MARKDOWN_MAX_LENGTH),
    };
  },
});
