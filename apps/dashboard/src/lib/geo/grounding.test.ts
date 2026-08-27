import { describe, expect, test } from "bun:test";

import { parseGeoCheckGrounding } from "@notra/db/utils/geo-grounding";

import { extractGrounding } from "./grounding";

const UNSAFE_SOURCE_URL = ["javascript", "alert(1)"].join(":");

describe("extractGrounding", () => {
  test("reads URL sources and web_search tool queries", () => {
    expect(
      extractGrounding({
        sources: [
          {
            sourceType: "url",
            url: "https://sparktoro.com/blog/geo",
            title: "GEO metrics",
          },
        ],
        toolResults: [
          {
            toolName: "web_search",
            output: {
              action: { query: "GEO metrics marketing team" },
              sources: [{ type: "url", url: "https://ahrefs.com/blog/geo" }],
            },
          },
        ],
      })
    ).toEqual({
      queries: ["GEO metrics marketing team"],
      sources: [
        {
          title: "GEO metrics",
          url: "https://sparktoro.com/blog/geo",
          domain: "sparktoro.com",
        },
        {
          title: "ahrefs.com",
          url: "https://ahrefs.com/blog/geo",
          domain: "ahrefs.com",
        },
      ],
    });
  });

  test("falls back to links in the answer when the provider sent none", () => {
    expect(
      extractGrounding({
        text: "See [SparkToro](https://sparktoro.com/blog/geo).",
      })
    ).toEqual({
      queries: [],
      sources: [
        {
          title: "SparkToro",
          url: "https://sparktoro.com/blog/geo",
          domain: "sparktoro.com",
        },
      ],
    });
  });

  test("ignores non-http sources", () => {
    expect(
      extractGrounding({
        sources: [{ url: UNSAFE_SOURCE_URL, title: "bad" }],
      })
    ).toEqual({ queries: [], sources: [] });
  });
});

describe("parseGeoCheckGrounding", () => {
  test("returns empty grounding for junk", () => {
    expect(parseGeoCheckGrounding(null)).toEqual({
      queries: [],
      sources: [],
    });
  });

  test("keeps valid queries and sources", () => {
    expect(
      parseGeoCheckGrounding({
        queries: [" GEO metrics ", "", 12],
        sources: [
          {
            title: "SparkToro",
            url: "https://sparktoro.com/blog/geo",
            domain: "sparktoro.com",
          },
          { title: "missing", url: "", domain: "x.com" },
          {
            title: "bad",
            url: UNSAFE_SOURCE_URL,
            domain: "evil.test",
          },
        ],
      })
    ).toEqual({
      queries: ["GEO metrics"],
      sources: [
        {
          title: "SparkToro",
          url: "https://sparktoro.com/blog/geo",
          domain: "sparktoro.com",
        },
      ],
    });
  });
});
