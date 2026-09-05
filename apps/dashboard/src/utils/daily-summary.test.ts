import { describe, expect, test } from "bun:test";

import {
  aggregateMentionTotals,
  buildDailySummary,
  buildDailySummaryHeadline,
  formatMentionRate,
  formatMentionRateDelta,
  getPreviousUtcDayWindow,
  isQuietDailySummary,
  truncatePrompt,
} from "./daily-summary";

describe("getPreviousUtcDayWindow", () => {
  test("returns the previous UTC calendar day", () => {
    const window = getPreviousUtcDayWindow(
      new Date("2026-09-05T08:15:00.000Z")
    );

    expect(window.start.toISOString()).toBe("2026-09-04T00:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-09-05T00:00:00.000Z");
  });
});

describe("mention rate formatting", () => {
  test("aggregates engine rows into a single rate", () => {
    expect(
      aggregateMentionTotals([
        { checks: 10, mentions: 4 },
        { checks: 10, mentions: 6 },
      ])
    ).toEqual({ checks: 20, mentions: 10, rate: 0.5 });
  });

  test("formats rates and point deltas", () => {
    expect(formatMentionRate(0.42)).toBe("42%");
    expect(formatMentionRateDelta(0.42, 0.39)).toBe("+3 pts");
    expect(formatMentionRateDelta(0.4, 0.4)).toBe("unchanged");
    expect(formatMentionRateDelta(0.37, 0.4)).toBe("-3 pts");
  });
});

describe("buildDailySummaryHeadline", () => {
  test("leads with the net prompt gain", () => {
    expect(
      buildDailySummaryHeadline({
        mentionRateLabel: "42%",
        gained: 8,
        lost: 1,
      })
    ).toBe("You're +7 prompts better than yesterday.");
  });

  test("names a net loss without spinning it", () => {
    expect(
      buildDailySummaryHeadline({
        mentionRateLabel: "38%",
        gained: 1,
        lost: 3,
      })
    ).toBe("You lost 2 prompts yesterday.");
  });
});

describe("isQuietDailySummary", () => {
  test("skips days with no scans and no checks", () => {
    expect(isQuietDailySummary({ scansCompleted: 0, yesterdayChecks: 0 })).toBe(
      true
    );
    expect(isQuietDailySummary({ scansCompleted: 1, yesterdayChecks: 0 })).toBe(
      false
    );
  });
});

describe("buildDailySummary", () => {
  test("keeps formatted stats and remaining change count", () => {
    const summary = buildDailySummary({
      windowStart: new Date("2026-09-04T00:00:00.000Z"),
      scansCompleted: 1,
      yesterday: { checks: 20, mentions: 8, rate: 0.4 },
      previousDay: { checks: 20, mentions: 7, rate: 0.35 },
      changes: {
        gained: 3,
        lost: 1,
        positionImproved: 1,
        positionDropped: 0,
        citationsAdded: 0,
        citationsRemoved: 0,
      },
      items: [
        {
          title: "What is the best changelog tool?",
          detail: "Gained mention · ChatGPT",
          tone: "up",
        },
      ],
      remainingCount: 2,
    });

    expect(summary.dateLabel).toBe("September 4, 2026");
    expect(summary.mentionRateLabel).toBe("40%");
    expect(summary.mentionRateDeltaLabel).toBe("+5 pts");
    expect(summary.gained).toBe(3);
    expect(summary.netChange).toBe(2);
    expect(summary.headline).toBe("You're +2 prompts better than yesterday.");
    expect(summary.remainingCount).toBe(2);
  });
});

describe("truncatePrompt", () => {
  test("collapses whitespace and ellipsizes long prompts", () => {
    expect(truncatePrompt("  What   is GEO?  ", 80)).toBe("What is GEO?");
    expect(truncatePrompt("abcdefghij", 8)).toBe("abcdefg…");
  });
});
