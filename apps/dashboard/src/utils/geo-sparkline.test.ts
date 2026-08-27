import { describe, expect, test } from "bun:test";

import {
  groupGeoSparklinePoints,
  sumGeoSparklinePoints,
} from "@/utils/geo-sparkline";

describe("groupGeoSparklinePoints", () => {
  test("groups rows into ordered metric series", () => {
    const grouped = groupGeoSparklinePoints(
      [
        { brand: "A", day: "2026-08-01", share: 0.3 },
        { brand: "B", day: "2026-08-01", share: 0.7 },
        { brand: "A", day: "2026-08-02", share: 0.4 },
      ],
      (row) => row.brand,
      (row) => ({ day: row.day, value: row.share })
    );

    expect(grouped.get("A")).toEqual([
      { day: "2026-08-01", value: 0.3 },
      { day: "2026-08-02", value: 0.4 },
    ]);
    expect(grouped.get("B")).toEqual([{ day: "2026-08-01", value: 0.7 }]);
  });
});

describe("sumGeoSparklinePoints", () => {
  test("sums matching days and keeps chronological order", () => {
    expect(
      sumGeoSparklinePoints([
        [
          { day: "2026-08-02", value: 0.2 },
          { day: "2026-08-01", value: 0.1 },
        ],
        [
          { day: "2026-08-01", value: 0.3 },
          { day: "2026-08-03", value: 0.4 },
        ],
      ])
    ).toEqual([
      { day: "2026-08-01", value: 0.4 },
      { day: "2026-08-02", value: 0.2 },
      { day: "2026-08-03", value: 0.4 },
    ]);
  });
});
