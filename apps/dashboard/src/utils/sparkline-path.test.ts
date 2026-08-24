import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { mentionRateSparklineLabel } from "@/utils/geo-charts";
import { sparklinePolyline } from "@/utils/sparkline-path";

describe("sparklinePolyline", () => {
  test("returns an empty string when there are no values", () => {
    assert.equal(sparklinePolyline({ values: [], width: 56, height: 20 }), "");
  });

  test("draws a flat midline when every value is the same", () => {
    assert.equal(
      sparklinePolyline({
        values: [40, 40, 40],
        width: 10,
        height: 10,
        padding: 0,
      }),
      "0.00,5.00 5.00,5.00 10.00,5.00"
    );
  });

  test("maps the first value to the left and the last to the right", () => {
    const points = sparklinePolyline({
      values: [0, 100],
      width: 10,
      height: 10,
      padding: 0,
    });
    assert.equal(points, "0.00,10.00 10.00,0.00");
  });
});

describe("mentionRateSparklineLabel", () => {
  test("describes a rising range", () => {
    assert.equal(
      mentionRateSparklineLabel([
        { day: "2026-08-01", value: 40 },
        { day: "2026-08-02", value: 48 },
        { day: "2026-08-03", value: 52 },
      ]),
      "Mention rate 40% to 52% over 3 days"
    );
  });

  test("describes a held rate", () => {
    assert.equal(
      mentionRateSparklineLabel([
        { day: "2026-08-01", value: 65 },
        { day: "2026-08-02", value: 65 },
      ]),
      "Mention rate held at 65% over 2 days"
    );
  });
});
