import { describe, expect, test } from "bun:test";

import type { GeoTrafficPoint, GeoTrafficSource } from "@/types/geo";
import {
  buildTrafficGroupSeries,
  groupTrafficSources,
  resolveTrafficSourceGroup,
  trafficGroupPurposeTotals,
} from "@/utils/ai-traffic-groups";

function crawler(
  source: string,
  category: string,
  visits: number,
  overrides: Partial<GeoTrafficSource> = {}
): GeoTrafficSource {
  return {
    source,
    visitorType: "crawler",
    agent: source,
    category,
    confidence: "verified",
    visits,
    markdownVisits: 0,
    paths: 1,
    lastSeenAt: "2026-08-20 10:00:00",
    ...overrides,
  };
}

describe("resolveTrafficSourceGroup", () => {
  test("maps OpenAI bots to the ChatGPT group", () => {
    expect(resolveTrafficSourceGroup("OAI-SearchBot", "crawler").key).toBe(
      "chatgpt"
    );
    expect(resolveTrafficSourceGroup("GPTBot", "crawler").key).toBe("chatgpt");
    expect(resolveTrafficSourceGroup("ChatGPT-User", "crawler").key).toBe(
      "chatgpt"
    );
  });

  test("puts lesser known crawlers into Other", () => {
    expect(resolveTrafficSourceGroup("YouBot", "crawler").key).toBe("other");
    expect(resolveTrafficSourceGroup("LinerBot", "crawler").key).toBe("other");
    expect(
      resolveTrafficSourceGroup("Browser-imitating agent", "crawler").key
    ).toBe("other");
  });

  test("gives coding agents their own groups", () => {
    expect(resolveTrafficSourceGroup("OpenCode", "crawler").key).toBe(
      "opencode"
    );
    expect(resolveTrafficSourceGroup("Cursor", "crawler").key).toBe("cursor");
  });

  test("sends lesser known referrers to Other", () => {
    expect(resolveTrafficSourceGroup("you.com", "ai_referral").key).toBe(
      "other"
    );
  });

  test("keeps referrals as their own labelled source", () => {
    expect(resolveTrafficSourceGroup("chatgpt", "ai_referral")).toEqual({
      key: "chatgpt",
      label: "ChatGPT",
      icon: "chatgpt",
    });
  });
});

describe("groupTrafficSources", () => {
  test("aggregates visits, markdown, last seen and purposes per vendor", () => {
    const sources: GeoTrafficSource[] = [
      crawler("GPTBot", "training-crawler", 40, {
        markdownVisits: 4,
        paths: 12,
        lastSeenAt: "2026-08-20 10:00:00",
      }),
      crawler("OAI-SearchBot", "search-index", 60, {
        markdownVisits: 6,
        paths: 8,
        lastSeenAt: "2026-08-21 09:30:00",
      }),
      crawler("YouBot", "search-index", 3),
      crawler("LinerBot", "search-index", 2),
      {
        ...crawler("chatgpt", "assistant-referral", 5),
        visitorType: "ai_referral",
      },
    ];

    const groups = groupTrafficSources(sources);
    const chatgpt = groups.find(
      (group) => group.key === "chatgpt" && group.visitorType === "crawler"
    );
    const other = groups.find((group) => group.key === "other");
    const referral = groups.find(
      (group) => group.visitorType === "ai_referral"
    );

    expect(groups).toHaveLength(3);
    expect(chatgpt?.visits).toBe(100);
    expect(chatgpt?.markdownVisits).toBe(10);
    expect(chatgpt?.paths).toBe(12);
    expect(chatgpt?.lastSeenAt).toBe("2026-08-21 09:30:00");
    expect(chatgpt?.categories).toEqual(["search-index", "training-crawler"]);
    expect(chatgpt?.members.map((member) => member.source)).toEqual([
      "OAI-SearchBot",
      "GPTBot",
    ]);
    expect(other?.members.map((member) => member.source)).toEqual([
      "YouBot",
      "LinerBot",
    ]);
    expect(referral?.label).toBe("ChatGPT");
  });
});

describe("trafficGroupPurposeTotals", () => {
  test("sums visits per purpose and lists contributing bots", () => {
    const [group] = groupTrafficSources([
      crawler("GPTBot", "training-crawler", 40),
      crawler("OAI-SearchBot", "search-index", 60),
      crawler("OAI-AdsBot", "search-index", 5),
      crawler("ChatGPT-User", "assistant-browse", 1),
    ]);
    if (group === undefined) {
      throw new Error("expected a ChatGPT group");
    }

    expect(trafficGroupPurposeTotals(group)).toEqual([
      {
        category: "search-index",
        visits: 65,
        members: ["OAI-SearchBot", "OAI-AdsBot"],
      },
      { category: "training-crawler", visits: 40, members: ["GPTBot"] },
      { category: "assistant-browse", visits: 1, members: ["ChatGPT-User"] },
    ]);
  });
});

describe("buildTrafficGroupSeries", () => {
  test("sums member sources per day", () => {
    const points: GeoTrafficPoint[] = [
      {
        day: "2026-08-20",
        visitorType: "crawler",
        source: "GPTBot",
        visits: 2,
      },
      {
        day: "2026-08-20",
        visitorType: "crawler",
        source: "OAI-SearchBot",
        visits: 3,
      },
      {
        day: "2026-08-21",
        visitorType: "crawler",
        source: "YouBot",
        visits: 9,
      },
      {
        day: "2026-08-21",
        visitorType: "ai_referral",
        source: "chatgpt",
        visits: 7,
      },
    ];
    const [chatgpt] = groupTrafficSources([
      crawler("GPTBot", "training-crawler", 2),
      crawler("OAI-SearchBot", "search-index", 3),
    ]);
    if (chatgpt === undefined) {
      throw new Error("expected a ChatGPT group");
    }

    expect(
      buildTrafficGroupSeries(points, chatgpt, ["2026-08-20", "2026-08-21"])
    ).toEqual([5, 0]);
  });
});
