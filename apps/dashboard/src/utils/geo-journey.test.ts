import { describe, expect, test } from "bun:test";

import type { GeoJourney } from "@/types/geo";
import {
  buildJourneyDepthSummary,
  buildJourneyOverview,
  classifyGeoJourneyPath,
  compactJourneyPaths,
  formatGeoJourneyPathLabel,
  formatJourneyKindSummary,
  isGeoJourneyTrailGap,
  normalizeGeoJourneyPath,
} from "@/utils/geo-journey";

function journey(
  overrides: Partial<GeoJourney> & Pick<GeoJourney, "journeyId" | "samplePaths">
): GeoJourney {
  return {
    source: "chatgpt",
    visitorType: "crawler",
    pages: overrides.samplePaths.length || 1,
    distinctPaths: new Set(overrides.samplePaths).size,
    firstSeenAt: "2026-08-24 16:35:00",
    lastSeenAt: "2026-08-24 16:35:20",
    ...overrides,
  };
}

describe("normalizeGeoJourneyPath", () => {
  test("strips query strings and trailing slashes", () => {
    expect(normalizeGeoJourneyPath("/docs/sdk/?ref=gpt")).toBe("/docs/sdk");
    expect(normalizeGeoJourneyPath("/")).toBe("/");
    expect(normalizeGeoJourneyPath("")).toBe("/");
  });
});

describe("classifyGeoJourneyPath", () => {
  test("classifies home, docs, posts, search, and generic pages", () => {
    expect(classifyGeoJourneyPath("/")).toBe("home");
    expect(classifyGeoJourneyPath("/index")).toBe("home");
    expect(classifyGeoJourneyPath("/docs/sdk")).toBe("docs");
    expect(classifyGeoJourneyPath("/changelog")).toBe("blog");
    expect(classifyGeoJourneyPath("/blog/geo-guide")).toBe("blog");
    expect(classifyGeoJourneyPath("/search")).toBe("search");
    expect(classifyGeoJourneyPath("/pricing?q=plan")).toBe("search");
    expect(classifyGeoJourneyPath("/customers/saas")).toBe("page");
  });
});

describe("formatGeoJourneyPathLabel", () => {
  test("shortens home and search, keeps readable paths", () => {
    expect(formatGeoJourneyPathLabel("/")).toBe("home");
    expect(formatGeoJourneyPathLabel("/search?q=geo")).toBe("search");
    expect(formatGeoJourneyPathLabel("/changelog")).toBe("/changelog");
    expect(
      formatGeoJourneyPathLabel("/blog/a-very-long-slug-that-should-collapse")
    ).toBe("…/a-very-long-slug-that-should-collapse");
  });
});

describe("compactJourneyPaths", () => {
  test("collapses consecutive repeats and inserts a gap when over the limit", () => {
    const trail = compactJourneyPaths(
      ["/", "/", "/docs", "/docs", "/pricing", "/contact", "/about"],
      3
    );

    expect(trail.omitted).toBe(2);
    expect(trail.nodes.map((node) => node.path)).toEqual([
      "/",
      "/docs",
      "…",
      "/about",
    ]);
    expect(isGeoJourneyTrailGap("…")).toBe(true);
  });

  test("keeps a short trail intact", () => {
    const trail = compactJourneyPaths(["/changelog", "/blog/geo-guide"], 4);
    expect(trail.omitted).toBe(0);
    expect(trail.nodes.map((node) => node.label)).toEqual([
      "/changelog",
      "/blog/geo-guide",
    ]);
  });
});

describe("buildJourneyOverview", () => {
  const journeys = [
    journey({
      journeyId: "a",
      source: "chatgpt",
      samplePaths: ["/", "/docs"],
      pages: 2,
    }),
    journey({
      journeyId: "b",
      source: "chatgpt",
      samplePaths: ["/"],
      pages: 1,
    }),
    journey({
      journeyId: "c",
      source: "gemini",
      samplePaths: ["/changelog", "/blog/geo-guide"],
      pages: 2,
    }),
    journey({
      journeyId: "d",
      source: "bytespider",
      samplePaths: ["/", "/docs", "/pricing", "/contact"],
      pages: 12,
    }),
  ];

  test("ranks sources and paths, and computes depth shares", () => {
    const overview = buildJourneyOverview(journeys);

    expect(overview.total).toBe(4);
    expect(overview.uniqueSources).toBe(3);
    expect(overview.medianPages).toBe(2);
    expect(overview.singleFetchShare).toBe(0.25);
    expect(overview.deepShare).toBe(0.25);
    expect(overview.sources[0]).toEqual({
      source: "chatgpt",
      visitorType: "crawler",
      journeys: 2,
    });
    expect(overview.paths[0]?.path).toBe("/");
    expect(overview.paths[0]?.journeys).toBe(3);
    expect(overview.uniquePaths).toBe(6);
    expect(formatJourneyKindSummary(overview.kindCounts)).toContain("home");
  });
});

describe("buildJourneyDepthSummary", () => {
  test("keeps the compact depth readout", () => {
    expect(
      buildJourneyDepthSummary([
        journey({ journeyId: "a", samplePaths: ["/"], pages: 1 }),
        journey({ journeyId: "b", samplePaths: ["/", "/docs"], pages: 2 }),
      ])
    ).toBe("median 2 pages · 0% crawl 10+ · 50% single-fetch");
  });
});
