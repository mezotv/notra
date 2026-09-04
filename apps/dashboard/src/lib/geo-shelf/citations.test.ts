import { describe, expect, test } from "bun:test";

import { foldShelfCitationRows } from "./citations";
import { canonicalizeShelfUrl, shelfDomainFromUrl } from "./url";

describe("canonicalizeShelfUrl", () => {
  test("collapses Reddit host aliases and tracking params onto one URL", () => {
    const canonical = canonicalizeShelfUrl(
      "https://www.reddit.com/r/SEO/comments/abc/how-are-you-tracking/"
    );
    expect(
      canonicalizeShelfUrl(
        "https://old.reddit.com/r/SEO/comments/abc/how-are-you-tracking/?utm_source=chatgpt"
      )
    ).toBe(canonical);
    expect(shelfDomainFromUrl(canonical)).toBe("reddit.com");
  });
});

describe("foldShelfCitationRows", () => {
  test("merges Reddit URL variants and unions prompts", () => {
    const pages = foldShelfCitationRows([
      {
        url: "https://www.reddit.com/r/SEO/comments/abc/thread/?utm_source=chatgpt",
        title: "How are you tracking brand mentions?",
        windowCount: 4,
        totalCount: 10,
        promptIds: ["p1", "p2"],
        engines: ["openai/gpt-5"],
        firstCitedAt: "2026-08-01T00:00:00.000Z",
        lastCitedAt: "2026-09-01T00:00:00.000Z",
      },
      {
        url: "https://old.reddit.com/r/SEO/comments/abc/thread/",
        title: "How are you tracking brand mentions?",
        windowCount: 2,
        totalCount: 3,
        promptIds: ["p2", "p3"],
        engines: ["perplexity/sonar"],
        firstCitedAt: "2026-07-01T00:00:00.000Z",
        lastCitedAt: "2026-09-03T00:00:00.000Z",
      },
    ]);

    expect(pages).toHaveLength(1);
    const page = pages[0];
    expect(page?.domain).toBe("reddit.com");
    expect(page?.citations.windowCount).toBe(6);
    expect(page?.citations.totalCount).toBe(13);
    expect(page?.citations.promptCount).toBe(3);
    expect(page?.citations.engines).toEqual([
      "openai/gpt-5",
      "perplexity/sonar",
    ]);
    expect(page?.citations.firstCitedAt).toBe("2026-07-01T00:00:00.000Z");
    expect(page?.citations.lastCitedAt).toBe("2026-09-03T00:00:00.000Z");
  });

  test("drops URLs that are not public http(s) pages", () => {
    expect(
      foldShelfCitationRows([
        {
          url: "not-a-url",
          title: null,
          windowCount: 1,
          totalCount: 1,
          promptIds: ["p1"],
          engines: ["openai/gpt-5"],
          firstCitedAt: "2026-09-01T00:00:00.000Z",
          lastCitedAt: "2026-09-01T00:00:00.000Z",
        },
      ])
    ).toEqual([]);
  });
});
