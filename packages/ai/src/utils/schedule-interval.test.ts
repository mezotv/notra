import { describe, expect, test } from "bun:test";

import {
  isCustomIntervalDue,
  nextCustomIntervalRun,
  parseUtcDate,
} from "./schedule-interval";

describe("recurring content schedule intervals", () => {
  test.each([
    "2025-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-1-01",
    "invalid",
  ])("rejects invalid anchor %s", (anchor) => {
    expect(parseUtcDate(anchor)).toBeNull();
  });

  test("accepts leap day without normalizing it into March", () => {
    expect(parseUtcDate("2024-02-29")?.toISOString()).toBe(
      "2024-02-29T00:00:00.000Z"
    );
  });

  const cron = {
    anchorDate: "2026-01-30",
    intervalDays: 3,
    hour: 23,
    minute: 30,
  };

  test.each([
    ["2026-01-30T23:29:59Z", false],
    ["2026-01-30T23:30:00Z", true],
    ["2026-01-31T00:15:00Z", true],
    ["2026-01-31T23:30:00Z", false],
    ["2026-02-01T23:30:00Z", false],
    ["2026-02-02T23:30:00Z", true],
  ] as const)("attributes delivery at %s to its scheduled day", (now, due) => {
    expect(isCustomIntervalDue(cron, new Date(now))).toBe(due);
  });

  test.each([
    ["2026-01-29T12:00:00Z", "2026-01-30T23:30:00.000Z"],
    ["2026-01-30T23:29:59Z", "2026-01-30T23:30:00.000Z"],
    ["2026-01-30T23:30:00Z", "2026-02-02T23:30:00.000Z"],
    ["2026-02-03T12:00:00Z", "2026-02-05T23:30:00.000Z"],
  ])(
    "computes the next interval from %s across month boundaries",
    (now, expected) => {
      expect(nextCustomIntervalRun(cron, new Date(now)).toISOString()).toBe(
        expected
      );
    }
  );

  test("keeps UTC schedule time across a daylight-saving transition", () => {
    const schedule = {
      anchorDate: "2026-03-28",
      intervalDays: 1,
      hour: 8,
      minute: 0,
    };
    expect(
      nextCustomIntervalRun(
        schedule,
        new Date("2026-03-28T08:00:00Z")
      ).toISOString()
    ).toBe("2026-03-29T08:00:00.000Z");
  });
});
