import { describe, expect, test } from "bun:test";

import { extractHttpUrls } from "./geo-opencode-sources";

describe("extractHttpUrls", () => {
  test("strips markdown-link closers and bold markers from cited URLs", () => {
    expect(
      extractHttpUrls(
        "**[Anthropic](https://www.anthropic.com/claude)** and **[Jasper](https://www.jasper.ai/)**"
      )
    ).toEqual(["https://www.anthropic.com/claude", "https://www.jasper.ai/"]);
  });

  test("strips leftover )** from a bare URL scrape", () => {
    expect(extractHttpUrls("https://chatgpt.com/)**")).toEqual([
      "https://chatgpt.com/",
    ]);
  });

  test("keeps ordinary URLs unchanged", () => {
    expect(
      extractHttpUrls("See https://writesonic.com/docs for details")
    ).toEqual(["https://writesonic.com/docs"]);
  });

  test("walks nested tool payloads", () => {
    expect(
      extractHttpUrls({
        output: {
          links: ["**[Copy.ai](https://www.copy.ai/)**"],
        },
      })
    ).toEqual(["https://www.copy.ai/"]);
  });
});
