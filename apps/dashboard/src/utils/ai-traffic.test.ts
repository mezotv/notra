import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { GeoTrafficPoint } from "@/types/geo";
import {
  buildTrafficSourceSeries,
  buildTrafficTrendRows,
  formatTrafficDelta,
  hasTrafficSourceSeries,
  isTrafficPagePending,
  trafficDeltaTone,
  trafficSourceKey,
  trafficSparklineDays,
  trafficVisitDelta,
} from "@/utils/ai-traffic";

function point(
  overrides: Partial<GeoTrafficPoint> &
    Pick<GeoTrafficPoint, "day" | "visitorType" | "visits">
): GeoTrafficPoint {
  return {
    source: "",
    ...overrides,
  };
}

describe("buildTrafficTrendRows", () => {
  test("sums crawlers and referrals per day", () => {
    const rows = buildTrafficTrendRows([
      point({
        day: "2026-08-20",
        visitorType: "crawler",
        source: "GPTBot",
        visits: 10,
      }),
      point({
        day: "2026-08-20",
        visitorType: "crawler",
        source: "ClaudeBot",
        visits: 4,
      }),
      point({
        day: "2026-08-20",
        visitorType: "ai_referral",
        source: "ChatGPT",
        visits: 2,
      }),
      point({
        day: "2026-08-21",
        visitorType: "crawler",
        source: "GPTBot",
        visits: 7,
      }),
    ]);

    assert.deepEqual(
      rows.map((row) => ({
        rawDay: row.rawDay,
        crawler: row.crawler,
        aiReferral: row.aiReferral,
      })),
      [
        { rawDay: "2026-08-20", crawler: 14, aiReferral: 2 },
        { rawDay: "2026-08-21", crawler: 7, aiReferral: 0 },
      ]
    );
  });

  test("ignores human traffic", () => {
    const rows = buildTrafficTrendRows([
      point({ day: "2026-08-20", visitorType: "human", visits: 40 }),
      point({
        day: "2026-08-20",
        visitorType: "crawler",
        source: "GPTBot",
        visits: 3,
      }),
    ]);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.crawler, 3);
    assert.equal(rows[0]?.aiReferral, 0);
  });
});

describe("traffic source series", () => {
  test("hasTrafficSourceSeries is false when source is missing", () => {
    assert.equal(
      hasTrafficSourceSeries([
        point({ day: "2026-08-20", visitorType: "crawler", visits: 3 }),
      ]),
      false
    );
  });

  test("builds a zero-filled series for one source", () => {
    const points = [
      point({
        day: "2026-08-20",
        visitorType: "crawler",
        source: "GPTBot",
        visits: 5,
      }),
      point({
        day: "2026-08-22",
        visitorType: "crawler",
        source: "GPTBot",
        visits: 8,
      }),
      point({
        day: "2026-08-22",
        visitorType: "crawler",
        source: "ClaudeBot",
        visits: 2,
      }),
    ];
    const days = trafficSparklineDays(points);

    assert.deepEqual(days, ["2026-08-20", "2026-08-22"]);
    assert.deepEqual(
      buildTrafficSourceSeries(points, "GPTBot", "crawler", days),
      [5, 8]
    );
    assert.equal(trafficSourceKey("GPTBot", "crawler"), "crawler:GPTBot");
    assert.equal(hasTrafficSourceSeries(points), true);
  });
});

describe("isTrafficPagePending", () => {
  test("keeps the skeleton up until traffic data is ready", () => {
    assert.equal(
      isTrafficPagePending({
        isSettingsPending: true,
        hasSettings: false,
        isTrafficPending: true,
        isEmptyTraffic: false,
        isIngestPending: true,
      }),
      true
    );
    assert.equal(
      isTrafficPagePending({
        isSettingsPending: false,
        hasSettings: true,
        isTrafficPending: true,
        isEmptyTraffic: false,
        isIngestPending: false,
      }),
      true
    );
    assert.equal(
      isTrafficPagePending({
        isSettingsPending: false,
        hasSettings: true,
        isTrafficPending: false,
        isEmptyTraffic: true,
        isIngestPending: true,
      }),
      true
    );
    assert.equal(
      isTrafficPagePending({
        isSettingsPending: false,
        hasSettings: true,
        isTrafficPending: false,
        isEmptyTraffic: true,
        isIngestPending: false,
      }),
      false
    );
    assert.equal(
      isTrafficPagePending({
        isSettingsPending: false,
        hasSettings: false,
        isTrafficPending: true,
        isEmptyTraffic: false,
        isIngestPending: true,
      }),
      false
    );
  });
});

describe("trafficVisitDelta", () => {
  test("formats and compares visit counts against the previous period", () => {
    assert.equal(formatTrafficDelta(19.4), "+19%");
    assert.equal(formatTrafficDelta(-9.2), "-9%");
    assert.equal(trafficDeltaTone(19.4), "up");
    assert.equal(trafficDeltaTone(-9.2), "down");
    assert.equal(trafficDeltaTone(0), "flat");
    assert.equal(trafficDeltaTone(0.4), "flat");
    assert.equal(trafficDeltaTone(-0.4), "flat");
    assert.equal(trafficVisitDelta(22, 18), (4 / 18) * 100);
    assert.equal(trafficVisitDelta(0, 0), null);
    assert.equal(trafficVisitDelta(5, 0), 100);
  });
});
