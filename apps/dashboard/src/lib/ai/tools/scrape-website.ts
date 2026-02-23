import { tool } from "ai";
import z from "zod";
import { getFirecrawlClient } from "@/lib/firecrawl";
import { toolDescription } from "@/utils/ai/description";

export const scrapeWebsiteTool = tool({
  description: toolDescription({
    toolName: "scrape_website",
    intro:
      "Scrapes a website URL and returns its content as markdown. Extracts the full page content including text, headings, and links.",
    whenToUse:
      "When user provides a URL and wants to read or analyze website content, extract information from a webpage, or needs page data for further processing.",
    usageNotes: `Requires a valid URL with protocol (https://).
Returns markdown-formatted content which preserves structure and is easy to read.`,
  }),
  inputSchema: z.object({
    url: z
      .url({ message: "Please enter a valid URL" })
      .describe("The URL of the website to scrape"),
  }),
  execute: async ({ url }) => {
    const firecrawl = getFirecrawlClient();
    const scrape = await firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: false,
    });

    return {
      content: scrape.markdown,
    };
  },
});
