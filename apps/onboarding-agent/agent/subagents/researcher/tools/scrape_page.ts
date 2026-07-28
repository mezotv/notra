import { fetchWebpage } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
import { SCRAPE_MARKDOWN_MAX_LENGTH } from "../../../lib/constants/context-dev";
import { webpageInputSchema } from "../../../lib/schemas/research-tools";
import { saveReferenceSnapshot } from "../../../lib/utils/reference-snapshot";
import { withTransientRetry } from "../../../lib/utils/retry";

export default defineTool({
  description:
    "Scrape a web page into clean markdown via context.dev. Use for company websites, blog posts, changelogs, and LinkedIn company pages.",
  inputSchema: webpageInputSchema,
  async execute({ url }, ctx) {
    const page = await withTransientRetry(() => fetchWebpage({ url }), {
      operationName: `Context.dev page scrape for ${url}`,
    });
    const snapshot = await saveReferenceSnapshot({
      ctx,
      markdown: page.markdown,
    });
    return {
      url: page.url,
      title: page.metadata?.title ?? null,
      markdown: page.markdown.slice(0, SCRAPE_MARKDOWN_MAX_LENGTH),
      ...(snapshot ?? {}),
    };
  },
});
