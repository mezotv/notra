import { describe, expect, test } from "bun:test";

import type { GeoTrafficPage } from "@/types/geo";
import { groupTrafficPages } from "@/utils/ai-traffic-pages";

function page(
  path: string,
  source: string,
  visits: number,
  overrides: Partial<GeoTrafficPage> = {}
): GeoTrafficPage {
  return {
    path,
    source,
    visitorType: "crawler",
    visits,
    lastSeenAt: "2026-08-28 06:00:00",
    ...overrides,
  };
}

describe("groupTrafficPages", () => {
  test("merges rows for the same path and sums visits", () => {
    const groups = groupTrafficPages([
      page("/pricing", "PerplexityBot", 4, { previousVisits: 1 }),
      page("/pricing", "google", 6, { previousVisits: 2 }),
      page("/pricing", "chatgpt", 3, {
        visitorType: "ai_referral",
        lastSeenAt: "2026-08-28 09:00:00",
      }),
      page("/", "PerplexityBot", 1),
    ]);

    expect(groups).toHaveLength(2);
    const pricing = groups.find((group) => group.path === "/pricing");
    expect(pricing?.visits).toBe(13);
    expect(pricing?.previousVisits).toBe(3);
    expect(pricing?.lastSeenAt).toBe("2026-08-28 09:00:00");
    expect(pricing?.sources.map((source) => source.source)).toEqual([
      "google",
      "PerplexityBot",
      "chatgpt",
    ]);
  });

  test("merges sources that share a label and visitor type", () => {
    const [group] = groupTrafficPages([
      page("/docs", "perplexity", 2),
      page("/docs", "Perplexity", 5),
      page("/docs", "perplexity", 1, { visitorType: "ai_referral" }),
    ]);

    expect(group?.sources).toHaveLength(2);
    expect(group?.sources[0]?.visits).toBe(7);
    expect(group?.sources[1]?.visitorType).toBe("ai_referral");
  });

  test("leaves previousVisits unset when no row has one", () => {
    const [group] = groupTrafficPages([page("/", "GPTBot", 2)]);
    expect(group?.previousVisits).toBeUndefined();
  });
});
