import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  isCustomIntervalDue,
  nextCustomIntervalRun,
  parseUtcDate,
} from "./schedule-interval";

const every3 = {
  hour: 9,
  minute: 0,
  intervalDays: 3,
  anchorDate: "2026-09-01",
};

describe("parseUtcDate", () => {
  test("parses a calendar date to UTC midnight", () => {
    assert.equal(
      parseUtcDate("2026-09-01")?.toISOString(),
      "2026-09-01T00:00:00.000Z"
    );
  });

  test("rejects malformed or impossible dates", () => {
    assert.equal(parseUtcDate("2026-9-1"), null);
    assert.equal(parseUtcDate("2026-02-30"), null);
  });
});

describe("isCustomIntervalDue", () => {
  test("is due on the anchor day and every N days after", () => {
    assert.equal(
      isCustomIntervalDue(every3, new Date("2026-09-01T09:00:00Z")),
      true
    );
    assert.equal(
      isCustomIntervalDue(every3, new Date("2026-09-02T09:00:00Z")),
      false
    );
    assert.equal(
      isCustomIntervalDue(every3, new Date("2026-09-03T09:00:00Z")),
      false
    );
    assert.equal(
      isCustomIntervalDue(every3, new Date("2026-09-04T09:00:00Z")),
      true
    );
  });

  test("attributes a late delivery to the day it was scheduled for", () => {
    const lateNight = { ...every3, hour: 23, minute: 30 };
    // Scheduled 2026-09-04 23:30, delivered after midnight.
    assert.equal(
      isCustomIntervalDue(lateNight, new Date("2026-09-05T00:10:00Z")),
      true
    );
  });

  test("is not due before the anchor", () => {
    assert.equal(
      isCustomIntervalDue(every3, new Date("2026-08-30T09:00:00Z")),
      false
    );
  });
});

describe("nextCustomIntervalRun", () => {
  test("returns today's slot when it has not passed on an interval day", () => {
    assert.equal(
      nextCustomIntervalRun(
        every3,
        new Date("2026-09-04T08:00:00Z")
      ).toISOString(),
      "2026-09-04T09:00:00.000Z"
    );
  });

  test("skips to the next interval day once today's slot has passed", () => {
    assert.equal(
      nextCustomIntervalRun(
        every3,
        new Date("2026-09-04T10:00:00Z")
      ).toISOString(),
      "2026-09-07T09:00:00.000Z"
    );
  });

  test("skips non-interval days", () => {
    assert.equal(
      nextCustomIntervalRun(
        every3,
        new Date("2026-09-02T10:00:00Z")
      ).toISOString(),
      "2026-09-04T09:00:00.000Z"
    );
  });

  test("starts at the anchor when the anchor is in the future", () => {
    assert.equal(
      nextCustomIntervalRun(
        every3,
        new Date("2026-08-20T10:00:00Z")
      ).toISOString(),
      "2026-09-01T09:00:00.000Z"
    );
  });
});
