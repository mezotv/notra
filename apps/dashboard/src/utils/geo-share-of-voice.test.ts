import { describe, expect, test } from "bun:test";

import { buildShareOfVoiceChartModel } from "./geo-share-of-voice";

describe("share of voice summary", () => {
  test("keeps the own brand outside the leaders without counting it in Other", () => {
    const model = buildShareOfVoiceChartModel({
      companyName: "Notra",
      points: [
        { brand: "A", mentions: 40 },
        { brand: "B", mentions: 25 },
        { brand: "C", mentions: 15 },
        { brand: "D", mentions: 10 },
        { brand: "Notra", mentions: 6 },
        { brand: "E", mentions: 4 },
      ],
    });

    expect(model.ranking.map((row) => row.brand)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "Notra",
    ]);
    expect(model.own?.rank).toBe(5);
    expect(model.own?.share).toBe(0.06);
    expect(model.other?.mentions).toBe(4);
    expect(model.slices.reduce((sum, row) => sum + row.mentions, 0)).toBe(100);
    expect(model.slices.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(
      1
    );
  });

  test("combines own-brand aliases before calculating share and rank", () => {
    const model = buildShareOfVoiceChartModel({
      companyName: "Notra",
      aliases: ["usenotra.com"],
      points: [
        { brand: "Notra", mentions: 4 },
        { brand: "usenotra.com", mentions: 6 },
        { brand: "Rival", mentions: 20 },
      ],
    });

    expect(model.own?.mentions).toBe(10);
    expect(model.own?.share).toBeCloseTo(1 / 3);
    expect(model.own?.rank).toBe(2);
    expect(model.ranking.filter((row) => row.own)).toHaveLength(1);
  });

  test("does not invent a rank for an unmentioned own brand", () => {
    const model = buildShareOfVoiceChartModel({
      companyName: "Notra",
      points: [{ brand: "Rival", mentions: 10 }],
    });

    expect(model.own?.rank).toBeNull();
    expect(model.own?.share).toBe(0);
    expect(model.totalMentions).toBe(10);
    expect(model.ranking.at(-1)?.brand).toBe("Notra");
  });

  test("shares ranks for ties and handles empty results", () => {
    const model = buildShareOfVoiceChartModel({
      companyName: "Notra",
      points: [
        { brand: "Rival", mentions: 10 },
        { brand: "Notra", mentions: 10 },
      ],
    });
    expect(model.ranking.map((row) => row.rank)).toEqual([1, 1]);
    expect(
      buildShareOfVoiceChartModel({ companyName: "Notra", points: [] })
        .totalMentions
    ).toBe(0);
  });
});
