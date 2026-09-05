import { describe, expect, test } from "bun:test";

import {
  aggregateMentionTotals,
  buildDailySummary,
  emptyChangesSummary,
  formatMentionRateDelta,
  getPreviousUtcDayWindow,
  isQuietDailySummary,
  truncatePrompt,
} from "./daily-summary";

describe("daily summary", () => {
  test("uses UTC boundaries across year changes and local DST", () => {
    for (const [now, start, end] of [
      ["2026-01-01T08:00:00Z", "2025-12-31", "2026-01-01"],
      ["2026-03-29T10:00:00+02:00", "2026-03-28", "2026-03-29"],
      ["2026-10-25T09:00:00+01:00", "2026-10-24", "2026-10-25"],
    ] as const) {
      const window = getPreviousUtcDayWindow(new Date(now));
      expect(window.start.toISOString()).toBe(`${start}T00:00:00.000Z`);
      expect(window.end.toISOString()).toBe(`${end}T00:00:00.000Z`);
    }
  });

  test("aggregates weighted mention rates and handles absent observations", () => {
    expect(aggregateMentionTotals([])).toEqual({
      checks: 0,
      mentions: 0,
      rate: null,
    });
    expect(
      aggregateMentionTotals([
        { checks: 9, mentions: 0 },
        { checks: 1, mentions: 1 },
      ]).rate
    ).toBe(0.1);
    expect(formatMentionRateDelta(0.42, 0.39)).toBe("+3 pts");
    expect(formatMentionRateDelta(0.39, 0.42)).toBe("-3 pts");
    expect(formatMentionRateDelta(0.42, null)).toBe("—");
  });

  test("only skips days with neither scans nor checks", () => {
    expect(isQuietDailySummary({ scansCompleted: 0, yesterdayChecks: 0 })).toBe(
      true
    );
    expect(isQuietDailySummary({ scansCompleted: 1, yesterdayChecks: 0 })).toBe(
      false
    );
    expect(isQuietDailySummary({ scansCompleted: 0, yesterdayChecks: 1 })).toBe(
      false
    );
  });

  test("does not claim visibility held steady without a comparison", () => {
    const summary = buildDailySummary({
      windowStart: new Date("2026-09-04T00:00:00Z"),
      scansCompleted: 1,
      yesterday: aggregateMentionTotals([{ checks: 100, mentions: 42 }]),
      previousDay: aggregateMentionTotals([]),
      changes: emptyChangesSummary(),
      items: [],
      remainingCount: 0,
    });
    expect(summary.headline).toBe("Yesterday's visibility: 42%.");
    expect(summary.mentionRateDeltaLabel).toBe("—");
    expect(summary.netChange).toBe(0);
  });

  test("collapses prompt whitespace and caps display length", () => {
    expect(truncatePrompt("  a\n b  ", 10)).toBe("a b");
    expect(truncatePrompt("a long prompt", 7)).toBe("a long…");
  });
});
