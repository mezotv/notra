import { describe, expect, test } from "bun:test";

import { perplexitySourcesFromExcerpt } from "./geo-perplexity-sources";

describe("perplexitySourcesFromExcerpt", () => {
  test("returns nothing when the answer has no links", () => {
    expect(
      perplexitySourcesFromExcerpt(
        "The answer lists Jasper, Copy.ai, and Writer without naming the company."
      )
    ).toEqual([]);
  });

  test("extracts markdown links before bare URLs and skips duplicate domains", () => {
    expect(
      perplexitySourcesFromExcerpt(
        "See [SparkToro](https://sparktoro.com/blog/geo) and https://www.sparktoro.com/plus plus https://ahrefs.com/blog/geo."
      )
    ).toEqual([
      {
        title: "SparkToro",
        domain: "sparktoro.com",
        url: "https://sparktoro.com/blog/geo",
        verified: true,
      },
      {
        title: "ahrefs.com",
        domain: "ahrefs.com",
        url: "https://ahrefs.com/blog/geo",
        verified: true,
      },
    ]);
  });
});
