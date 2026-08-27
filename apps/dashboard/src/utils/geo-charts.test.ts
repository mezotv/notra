import { describe, expect, test } from "bun:test";

import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import type { GeoOverviewEngine, GeoTimeseriesPoint } from "@/types/geo";
import {
  buildMentionProviderRows,
  buildShareOfVoiceBreakdown,
  engineFamilyStatTrends,
  formatGeoStatDelta,
  geoStatDeltaTone,
  mentionOverviewTotals,
  mentionStatTrends,
  withTrackedMentionEngines,
} from "@/utils/geo-charts";

function familyPoint(
  day: string,
  mentions: number,
  checks: number,
  avgPosition: number | null = null,
  engine = "openai/gpt-5.4"
): GeoTimeseriesPoint {
  return { day, engine, checks, mentions, avgPosition };
}

describe("buildShareOfVoiceBreakdown", () => {
  test("keeps leftover brands on Other instead of dropping them", () => {
    const breakdown = buildShareOfVoiceBreakdown(
      [
        { brand: "Resend", mentions: 62 },
        { brand: "Postmark", mentions: 58 },
        { brand: "SendGrid", mentions: 55 },
        { brand: "Mailgun", mentions: 40 },
        { brand: "Nodemailer", mentions: 10 },
        { brand: "Novu", mentions: 6 },
      ],
      { limit: 4 }
    );

    expect(breakdown.rows.map((row) => row.brand)).toEqual([
      "Resend",
      "Postmark",
      "SendGrid",
      "Mailgun",
      CHART_OTHER_SLICE_LABEL,
    ]);
    expect(breakdown.others.map((row) => row.brand)).toEqual([
      "Nodemailer",
      "Novu",
    ]);

    const other = breakdown.rows.at(-1);
    expect(other?.mentions).toBe(16);
    expect(breakdown.others.reduce((sum, row) => sum + row.mentions, 0)).toBe(
      16
    );
  });

  test("omits Other when every brand fits the limit", () => {
    const breakdown = buildShareOfVoiceBreakdown(
      [
        { brand: "Resend", mentions: 20 },
        { brand: "Postmark", mentions: 10 },
      ],
      { limit: 5 }
    );

    expect(breakdown.rows.map((row) => row.brand)).toEqual([
      "Resend",
      "Postmark",
    ]);
    expect(breakdown.others).toEqual([]);
  });

  test("combines the daily trend for brands grouped into Other", () => {
    const breakdown = buildShareOfVoiceBreakdown(
      [
        {
          brand: "Resend",
          mentions: 50,
          trend: [
            { day: "2026-08-01", value: 0.5 },
            { day: "2026-08-02", value: 0.4 },
          ],
        },
        {
          brand: "Postmark",
          mentions: 30,
          trend: [
            { day: "2026-08-01", value: 0.3 },
            { day: "2026-08-02", value: 0.2 },
          ],
        },
        {
          brand: "SendGrid",
          mentions: 20,
          trend: [
            { day: "2026-08-01", value: 0.2 },
            { day: "2026-08-02", value: 0.4 },
          ],
        },
      ],
      { limit: 1 }
    );

    const otherTrend = breakdown.rows.at(-1)?.trend;
    expect(otherTrend?.map((point) => point.day)).toEqual([
      "2026-08-01",
      "2026-08-02",
    ]);
    expect(otherTrend?.[0]?.value).toBeCloseTo(0.5);
    expect(otherTrend?.[1]?.value).toBeCloseTo(0.6);
  });
});

describe("engineFamilyStatTrends", () => {
  const today = "2026-01-11";

  test("compares the first half of settled days with the second", () => {
    const trends = engineFamilyStatTrends(
      [
        familyPoint("2026-01-01", 4, 10, 4),
        familyPoint("2026-01-02", 4, 10, 4),
        familyPoint("2026-01-03", 7, 10, 3),
        familyPoint("2026-01-04", 7, 10, 3),
      ],
      "openai",
      today
    );

    expect(trends.ratePts).toBeCloseTo(30);
    expect(trends.mentionDelta).toBe(75);
    expect(trends.positionDelta).toBe(-1);
  });

  test("ignores other families and an incomplete today", () => {
    const trends = engineFamilyStatTrends(
      [
        familyPoint("2026-01-01", 2, 10, 5),
        familyPoint("2026-01-02", 8, 10, 2),
        familyPoint("2026-01-11", 10, 10, 1),
        familyPoint("2026-01-01", 9, 10, 1, "anthropic/claude-4"),
      ],
      "openai",
      today
    );

    expect(trends.ratePts).toBeCloseTo(60);
    expect(trends.mentionDelta).toBe(300);
    expect(trends.positionDelta).toBe(-3);
  });

  test("returns empty trends when there is not enough history", () => {
    expect(
      engineFamilyStatTrends(
        [familyPoint("2026-01-10", 5, 10, 3)],
        "openai",
        today
      )
    ).toEqual({
      ratePts: null,
      mentionDelta: null,
      positionDelta: null,
    });
  });

  test("weights position by mentions across engines on the same day", () => {
    const trends = engineFamilyStatTrends(
      [
        familyPoint("2026-01-01", 1, 5, 5, "openai/gpt-5.4"),
        familyPoint("2026-01-01", 3, 5, 3, "openai/gpt-5.4-grounded"),
        familyPoint("2026-01-02", 2, 5, 2, "openai/gpt-5.4"),
        familyPoint("2026-01-02", 2, 5, 2, "openai/gpt-5.4-grounded"),
      ],
      "openai",
      today
    );

    expect(trends.positionDelta).toBe(-1.5);
  });
});

describe("mentionStatTrends", () => {
  const today = "2026-01-11";

  test("rolls every family into one mention delta", () => {
    const trends = mentionStatTrends(
      [
        familyPoint("2026-01-01", 4, 10, 4, "openai/gpt-5.4"),
        familyPoint("2026-01-01", 2, 10, 5, "anthropic/claude-4"),
        familyPoint("2026-01-02", 7, 10, 3, "openai/gpt-5.4"),
        familyPoint("2026-01-02", 4, 10, 4, "anthropic/claude-4"),
      ],
      { today }
    );

    expect(trends.mentionDelta).toBeCloseTo(((11 - 6) / 6) * 100);
    expect(trends.ratePts).toBeCloseTo(25);
  });
});

function overviewEngine(
  engine: string,
  mentions: number,
  checks = 10
): GeoOverviewEngine {
  return {
    engine,
    checks,
    mentions,
    mentionRate: checks === 0 ? 0 : mentions / checks,
    avgPosition: mentions > 0 ? 2 : null,
    lastCheckedAt: mentions > 0 ? "2026-01-02T00:00:00.000Z" : "",
  };
}

describe("withTrackedMentionEngines", () => {
  test("adds configured families that have no scan rows yet", () => {
    const merged = withTrackedMentionEngines(
      [overviewEngine("openai/gpt-5.4", 4)],
      ["openai/gpt-5.4", "google/gemini-2.5-pro", "perplexity-sonar"]
    );

    expect(merged.map((engine) => engine.engine)).toEqual([
      "openai/gpt-5.4",
      "google/gemini-2.5-pro",
      "perplexity-sonar",
    ]);
    expect(merged[1]?.mentions).toBe(0);
  });

  test("does not duplicate a family that already has scan data", () => {
    const merged = withTrackedMentionEngines(
      [overviewEngine("openai/gpt-5.4", 4)],
      ["openai/gpt-5.4-grounded"]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.engine).toBe("openai/gpt-5.4");
  });
});

describe("buildMentionProviderRows", () => {
  test("keeps zero-mention families and sorts them last", () => {
    const rows = buildMentionProviderRows(
      [overviewEngine("openai/gpt-5.4", 4)],
      {
        trackedEngines: [
          "openai/gpt-5.4",
          "google/gemini-2.5-pro",
          "anthropic/claude-sonnet-4.6",
        ],
      }
    );

    expect(rows.map((row) => row.family.family)).toEqual([
      "openai",
      "claude",
      "gemini",
    ]);
    expect(rows[0]?.totals.mentions).toBe(4);
    expect(rows[1]?.totals.mentions).toBe(0);
    expect(rows[2]?.totals.mentions).toBe(0);
  });
});

describe("mentionOverviewTotals", () => {
  test("sums mentions and checks across engines", () => {
    expect(
      mentionOverviewTotals([
        {
          engine: "openai/gpt-5.4",
          checks: 10,
          mentions: 4,
          mentionRate: 0.4,
          avgPosition: 2,
          lastCheckedAt: "2026-01-02T00:00:00.000Z",
        },
        {
          engine: "anthropic/claude-4",
          checks: 10,
          mentions: 6,
          mentionRate: 0.6,
          avgPosition: 3,
          lastCheckedAt: "2026-01-02T00:00:00.000Z",
        },
      ])
    ).toEqual({ mentions: 10, checks: 20, rate: 0.5 });
  });
});

describe("geoStatDeltaTone", () => {
  test("treats a lower position as an improvement", () => {
    expect(geoStatDeltaTone(-0.4, "position")).toBe("up");
    expect(geoStatDeltaTone(0.4, "position")).toBe("down");
    expect(geoStatDeltaTone(0.04, "position")).toBe("flat");
  });

  test("treats a higher mention rate as an improvement", () => {
    expect(geoStatDeltaTone(5, "rate")).toBe("up");
    expect(geoStatDeltaTone(-5, "rate")).toBe("down");
    expect(geoStatDeltaTone(0.4, "rate")).toBe("flat");
  });
});

describe("formatGeoStatDelta", () => {
  test("formats each metric in its own unit", () => {
    expect(formatGeoStatDelta(5.4, "rate")).toBe("+5 pts");
    expect(formatGeoStatDelta(-8.2, "mentions")).toBe("-8%");
    expect(formatGeoStatDelta(-0.4, "position")).toBe("-0.4");
    expect(formatGeoStatDelta(1, "position")).toBe("+1");
  });

  test("omits sign for flat deltas", () => {
    expect(formatGeoStatDelta(0, "mentions")).toBe("0%");
    expect(formatGeoStatDelta(0, "rate")).toBe("0 pts");
    expect(formatGeoStatDelta(0, "position")).toBe("0");
  });
});
