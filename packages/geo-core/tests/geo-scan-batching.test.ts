import { describe, expect, test } from "bun:test";

import {
  chunkGeoScanItems,
  interleaveGeoScanItemsByKey,
} from "../src/utils/geo-scan";

interface PlannedItem {
  engine: string;
  prompt: number;
}

function engineMajor(engines: string[], prompts: number): PlannedItem[] {
  return engines.flatMap((engine) =>
    Array.from({ length: prompts }, (_, prompt) => ({ engine, prompt }))
  );
}

describe("GEO scan batching", () => {
  test("interleaving rotates through engines while keeping each engine's order", () => {
    const items = engineMajor(["a", "b", "c"], 2);
    expect(interleaveGeoScanItemsByKey(items, (item) => item.engine)).toEqual([
      { engine: "a", prompt: 0 },
      { engine: "b", prompt: 0 },
      { engine: "c", prompt: 0 },
      { engine: "a", prompt: 1 },
      { engine: "b", prompt: 1 },
      { engine: "c", prompt: 1 },
    ]);
  });

  test("interleaving keeps every item once when engines have uneven counts", () => {
    const items = [
      ...engineMajor(["grounded"], 1),
      ...engineMajor(["a", "b"], 3),
    ];
    const interleaved = interleaveGeoScanItemsByKey(
      items,
      (item) => item.engine
    );
    expect(interleaved).toHaveLength(items.length);
    expect(new Set(interleaved)).toEqual(new Set(items));
    expect(interleaved.slice(0, 3).map((item) => item.engine)).toEqual([
      "grounded",
      "a",
      "b",
    ]);
  });

  test("interleaved batches spread one wave across the whole engine catalog", () => {
    const engines = Array.from({ length: 21 }, (_, index) => `engine-${index}`);
    const batches = chunkGeoScanItems(
      interleaveGeoScanItemsByKey(
        engineMajor(engines, 8),
        (item) => item.engine
      ),
      4
    );
    const firstWave = batches.slice(0, 6).flat();
    expect(new Set(firstWave.map((item) => item.engine)).size).toBe(21);
    const engineMajorWave = chunkGeoScanItems(engineMajor(engines, 8), 4)
      .slice(0, 6)
      .flat();
    expect(new Set(engineMajorWave.map((item) => item.engine)).size).toBe(3);
  });

  test("empty input interleaves to an empty list", () => {
    expect(interleaveGeoScanItemsByKey([], () => "x")).toEqual([]);
  });
});
