import { describe, expect, test } from "bun:test";

import { geoAnswerSourcesFor } from "../src/utils/geo-answer-sources";

describe("geoAnswerSourcesFor", () => {
  test("strips markdown leftovers from stored OpenCode source URLs", () => {
    expect(
      geoAnswerSourcesFor(
        {
          sources: [
            {
              title: "anthropic.com",
              url: "https://www.anthropic.com/claude)**",
              domain: "anthropic.com",
            },
            {
              title: "jasper.ai",
              url: "https://www.jasper.ai/)**",
              domain: "jasper.ai",
            },
          ],
        },
        []
      )
    ).toEqual([
      {
        title: "anthropic.com",
        url: "https://www.anthropic.com/claude",
        domain: "anthropic.com",
      },
      {
        title: "jasper.ai",
        url: "https://www.jasper.ai/",
        domain: "jasper.ai",
      },
    ]);
  });

  test("does not treat a Wikipedia path parenthesis as markdown junk", () => {
    expect(
      geoAnswerSourcesFor({ sources: [] }, [
        {
          title: null,
          url: "https://en.wikipedia.org/wiki/Answer_(law)",
        },
      ])
    ).toEqual([
      {
        title: "en.wikipedia.org",
        url: "https://en.wikipedia.org/wiki/Answer_(law)",
        domain: "en.wikipedia.org",
      },
    ]);
  });
});
