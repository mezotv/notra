import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { GeoTimeseriesPoint } from "@/types/geo";
import { buildEngineFamilyModeTrendRows } from "@/utils/geo-charts";

function point(
  overrides: Pick<GeoTimeseriesPoint, "day" | "engine" | "mentions" | "checks">
): GeoTimeseriesPoint {
  return overrides;
}

describe("buildEngineFamilyModeTrendRows", () => {
  test("splits search and memory rates for one family", () => {
    const rows = buildEngineFamilyModeTrendRows(
      [
        point({
          day: "2026-08-20",
          engine: "gpt-4o-grounded",
          mentions: 8,
          checks: 10,
        }),
        point({
          day: "2026-08-20",
          engine: "gpt-4o",
          mentions: 4,
          checks: 10,
        }),
        point({
          day: "2026-08-21",
          engine: "gpt-4o-grounded",
          mentions: 5,
          checks: 10,
        }),
        point({
          day: "2026-08-21",
          engine: "perplexity-sonar",
          mentions: 9,
          checks: 10,
        }),
      ],
      "openai"
    );

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.search, 80);
    assert.equal(rows[0]?.memory, 40);
    assert.equal(rows[1]?.search, 50);
    assert.equal(rows[1]?.memory, null);
  });

  test("fills calendar days between the first and last sample", () => {
    const rows = buildEngineFamilyModeTrendRows(
      [
        point({
          day: "2026-08-20",
          engine: "gpt-4o-grounded",
          mentions: 8,
          checks: 10,
        }),
        point({
          day: "2026-08-22",
          engine: "gpt-4o-grounded",
          mentions: 5,
          checks: 10,
        }),
      ],
      "openai"
    );

    assert.equal(rows.length, 3);
    assert.equal(rows[0]?.rawDay, "2026-08-20");
    assert.equal(rows[0]?.search, 80);
    assert.equal(rows[1]?.rawDay, "2026-08-21");
    assert.equal(rows[1]?.search, null);
    assert.equal(rows[2]?.rawDay, "2026-08-22");
    assert.equal(rows[2]?.search, 50);
  });
});
