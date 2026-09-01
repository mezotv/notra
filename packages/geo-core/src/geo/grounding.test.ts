import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { extractGrounding } from "./grounding";

describe("GEO grounding extraction", () => {
  test("extracts Gemini search queries and sources from gateway metadata", () => {
    const grounding = extractGrounding({
      providerMetadata: {
        googleVertex: {
          groundingMetadata: {
            webSearchQueries: ["Notra GEO", "Notra GEO"],
            groundingChunks: [
              {
                web: {
                  uri: "https://www.usenotra.com/geo",
                  title: "Notra GEO",
                },
              },
              {
                retrievedContext: {
                  uri: "https://vercel.com/docs/ai-gateway/models-and-providers/web-search",
                  title: "Web Search",
                },
              },
            ],
          },
        },
      },
    });

    assert.deepEqual(grounding, {
      queries: ["Notra GEO"],
      sources: [
        {
          url: "https://www.usenotra.com/geo",
          title: "Notra GEO",
          domain: "usenotra.com",
        },
        {
          url: "https://vercel.com/docs/ai-gateway/models-and-providers/web-search",
          title: "Web Search",
          domain: "vercel.com",
        },
      ],
    });
  });

  test("extracts grounding metadata emitted on generation steps", () => {
    const grounding = extractGrounding({
      steps: [
        {
          providerMetadata: {
            vertex: {
              groundingMetadata: {
                webSearchQueries: ["current answer engine results"],
              },
            },
          },
        },
      ],
    });

    assert.deepEqual(grounding.queries, ["current answer engine results"]);
  });
});
