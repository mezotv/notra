import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { GeoModelUsagePoint, GeoModelUsageRow } from "../types/geo";
import { chartKey } from "./chart-keys";
import { buildModelUsageChart } from "./geo-model-usage";

function model(
  id: string,
  share: number,
  rawTokens: number | null = null
): GeoModelUsageRow {
  return {
    model: id,
    label: id.split("/")[1] ?? id,
    rank: 1,
    share,
    rawTokens,
    scanned: false,
    mentionRate: null,
    checks: 0,
  };
}

describe("buildModelUsageChart", () => {
  const featured = [
    model("tencent/hy3", 0.4, 40),
    model("deepseek/v4", 0.3, 30),
  ];

  test("stacks only the featured models and drops weeks they have no volume", () => {
    const points: GeoModelUsagePoint[] = [
      { week: "2026-05-04", model: "openai/gpt-5", share: 1, tokens: 100 },
      { week: "2026-08-10", model: "tencent/hy3", share: 0.4, tokens: 40 },
      { week: "2026-08-10", model: "deepseek/v4", share: 0.3, tokens: 30 },
      { week: "2026-08-10", model: "openai/gpt-5", share: 0.3, tokens: 30 },
    ];

    const chart = buildModelUsageChart(
      featured,
      points,
      "2026-08-10",
      "2026-08-20"
    );

    assert.equal(chart.metric, "tokens");
    assert.deepEqual(
      chart.rows.map((row) => row.rawWeek),
      ["2026-08-10"]
    );
    assert.equal(chart.rows[0]?.[chartKey("tencent/hy3")], 40);
    assert.equal(chart.rows[0]?.[chartKey("openai/gpt-5")], undefined);
  });

  test("falls back to the latest snapshot when trend points are missing", () => {
    const chart = buildModelUsageChart(
      featured,
      [],
      "2026-08-10",
      "2026-08-20"
    );

    assert.equal(chart.rows.length, 1);
    assert.equal(chart.rows[0]?.[chartKey("tencent/hy3")], 40);
  });
});
