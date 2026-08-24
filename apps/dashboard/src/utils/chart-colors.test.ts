import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  ACCOUNT_SERIES_COLORS,
  CHART_PRIMARY_COLOR,
  CHART_SECONDARY_COLOR,
  MODEL_USAGE_SERIES_COLORS,
  RIVAL_SWATCHES,
} from "@/constants/charts";

const MODE_HEXES = new Set([
  CHART_PRIMARY_COLOR.light,
  CHART_PRIMARY_COLOR.dark,
  CHART_SECONDARY_COLOR.light,
  CHART_SECONDARY_COLOR.dark,
]);

describe("chart series colors", () => {
  test("model and account series skip Search and Memory hues", () => {
    for (const pair of [
      ...ACCOUNT_SERIES_COLORS,
      ...MODEL_USAGE_SERIES_COLORS,
    ]) {
      assert.equal(MODE_HEXES.has(pair.light), false, pair.light);
      assert.equal(MODE_HEXES.has(pair.dark), false, pair.dark);
    }
  });

  test("rival swatches skip Search and Memory hues", () => {
    for (const swatch of RIVAL_SWATCHES) {
      assert.equal(MODE_HEXES.has(swatch), false, swatch);
    }
  });
});
