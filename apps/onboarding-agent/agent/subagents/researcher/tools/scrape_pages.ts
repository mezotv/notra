import { fetchWebpage } from "@notra/ai/utils/context-dev";
import { Effect } from "effect";
import { defineTool } from "eve/tools";
import {
  SCRAPE_BATCH_MIN_PAGE_LENGTH,
  SCRAPE_MARKDOWN_MAX_LENGTH,
} from "../../../lib/constants/context-dev";
import { webpagesInputSchema } from "../../../lib/schemas/research-tools";
import { saveReferenceSnapshot } from "../../../lib/utils/reference-snapshot";
import { withTransientRetryEffect } from "../../../lib/utils/retry";

export default defineTool({
  description:
    "Scrape up to 50 known owned-blog or newsroom URLs via context.dev in one bounded-concurrency call. Use after crawl_sitemap to collect reference candidates efficiently.",
  inputSchema: webpagesInputSchema,
  async execute({ urls }, ctx) {
    const perPageMarkdownLimit = Math.max(
      SCRAPE_BATCH_MIN_PAGE_LENGTH,
      Math.floor(SCRAPE_MARKDOWN_MAX_LENGTH / urls.length)
    );
    return Effect.runPromise(
      Effect.all(
        urls.map((url) =>
          withTransientRetryEffect(
            async () => {
              const page = await fetchWebpage({ url });
              const snapshot = await saveReferenceSnapshot({
                ctx,
                markdown: page.markdown,
              });
              return {
                markdown: page.markdown.slice(0, perPageMarkdownLimit),
                title: page.metadata?.title ?? null,
                url: page.url,
                ...(snapshot ?? {}),
              };
            },
            { operationName: `Context.dev page scrape for ${url}` }
          ).pipe(
            Effect.catch((error) =>
              Effect.succeed({
                error: error.message,
                markdown: null,
                title: null,
                url,
              })
            )
          )
        ),
        { concurrency: 5 }
      )
    );
  },
});
