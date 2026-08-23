import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { perplexitySourcesFromExcerpt } from "@/utils/geo-perplexity-sources";

describe("perplexitySourcesFromExcerpt", () => {
  test("reads markdown links and skips duplicate domains", () => {
    const sources = perplexitySourcesFromExcerpt(
      "See [TechCrunch](https://www.techcrunch.com/post) and https://techcrunch.com/other"
    );

    assert.deepEqual(sources, [
      {
        title: "TechCrunch",
        domain: "techcrunch.com",
        url: "https://www.techcrunch.com/post",
        verified: true,
      },
    ]);
  });

  test("reads bare URLs when there is no markdown title", () => {
    const sources = perplexitySourcesFromExcerpt(
      "Coverage at https://theverge.com/notion-mail"
    );

    assert.deepEqual(sources, [
      {
        title: "theverge.com",
        domain: "theverge.com",
        url: "https://theverge.com/notion-mail",
        verified: true,
      },
    ]);
  });

  test("ignores javascript and data URLs", () => {
    const sources = perplexitySourcesFromExcerpt(
      "See [xss](javascript:alert(1)) and data:text/html,hi and https://example.com/ok"
    );

    assert.deepEqual(sources, [
      {
        title: "example.com",
        domain: "example.com",
        url: "https://example.com/ok",
        verified: true,
      },
    ]);
  });
});
