import { describe, expect, test } from "bun:test";

import type { MentionTrendRow } from "@/types/geo";
import { fitMentionTrendLine, mentionCountDelta } from "@/utils/geo-charts";

const TOTAL_KEY = "total";

describe("fitMentionTrendLine", () => {
  test("projects through today without fitting today's partial total", () => {
    const rows: MentionTrendRow[] = [
      { day: "Aug 25", rawDay: "2026-08-25", [TOTAL_KEY]: 10 },
      { day: "Aug 26", rawDay: "2026-08-26", [TOTAL_KEY]: 20 },
      { day: "Aug 27", rawDay: "2026-08-27", [TOTAL_KEY]: 2 },
    ];

    expect(fitMentionTrendLine(rows, TOTAL_KEY, "2026-08-27")).toEqual([
      10, 20, 30,
    ]);
  });
});

describe("mentionCountDelta", () => {
  test("compares average daily mentions between both halves", () => {
    expect(
      mentionCountDelta([
        { day: "2026-08-21", value: 10 },
        { day: "2026-08-22", value: 10 },
        { day: "2026-08-23", value: 12 },
        { day: "2026-08-24", value: 12 },
      ])
    ).toBe(20);
  });

  test("excludes today's partial mentions", () => {
    expect(
      mentionCountDelta(
        [
          { day: "2026-08-25", value: 10 },
          { day: "2026-08-26", value: 20 },
          { day: "2026-08-27", value: 100 },
        ],
        "2026-08-27"
      )
    ).toBe(100);
  });

  test("returns null when there is no meaningful comparison", () => {
    expect(mentionCountDelta([])).toBeNull();
    expect(
      mentionCountDelta([
        { day: "2026-08-21", value: 0 },
        { day: "2026-08-22", value: 0 },
      ])
    ).toBeNull();
  });
});
