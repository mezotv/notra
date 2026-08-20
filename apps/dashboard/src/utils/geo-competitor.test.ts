import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildGeoCompetitorPoints,
  competitorMentionStats,
} from "./geo-competitor";

describe("buildGeoCompetitorPoints", () => {
  test("fills missing days with zero and keeps the ISO day", () => {
    const points = buildGeoCompetitorPoints(
      [
        { day: "2026-08-06", mentions: 12, checks: 40 },
        { day: "2026-08-08", mentions: 20, checks: 40 },
      ],
      "2026-08-08"
    );

    assert.deepEqual(
      points.map((point) => [point.rawDay, point.mentions]),
      [
        ["2026-08-06", 12],
        ["2026-08-07", 0],
        ["2026-08-08", 20],
      ]
    );
  });
});

describe("competitorMentionStats", () => {
  test("ignores an empty in-progress today so latest is not zero", () => {
    const points = buildGeoCompetitorPoints(
      [
        { day: "2026-08-18", mentions: 41, checks: 40 },
        { day: "2026-08-19", mentions: 32, checks: 40 },
      ],
      "2026-08-20"
    );
    const stats = competitorMentionStats(points, "2026-08-20");

    assert.equal(stats?.latest, 32);
    assert.equal(stats?.peak, 41);
  });
});
