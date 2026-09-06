import { describe, expect, test } from "bun:test";

import {
  geoScanEmptyEngineSkipReason,
  scopeGeoScanEngines,
} from "../src/utils/geo-engines";

describe("scopeGeoScanEngines", () => {
  const tracked = [
    "anthropic/claude-sonnet-5",
    "openai/gpt-5.6-sol",
    "google/gemini-3.5-flash",
  ];

  test("omitted subset keeps tracked engines in order", () => {
    expect(scopeGeoScanEngines(tracked)).toEqual([...tracked]);
  });

  test("keeps requested engines that are still tracked", () => {
    expect(
      scopeGeoScanEngines(tracked, [
        "openai/gpt-5.6-sol",
        "google/ai-overview",
        "openai/gpt-5.6-sol",
      ])
    ).toEqual(["openai/gpt-5.6-sol"]);
  });

  test("drops a subset that matches nothing", () => {
    expect(scopeGeoScanEngines(tracked, ["google/ai-overview"])).toEqual([]);
  });
});

describe("geoScanEmptyEngineSkipReason", () => {
  test("skips a requested subset that no longer intersects the project", () => {
    expect(geoScanEmptyEngineSkipReason([], 0, ["google/ai-overview"])).toBe(
      "scoped_engines_missing"
    );
  });

  test("skips when every selected engine is rejected by ZDR", () => {
    expect(
      geoScanEmptyEngineSkipReason(["google/ai-overview"], 0, [
        "google/ai-overview",
      ])
    ).toBe("zdr");
  });

  test("does not skip a full-project scan that still has engines", () => {
    expect(geoScanEmptyEngineSkipReason(["openai/gpt-5.6-sol"], 1)).toBe(null);
  });
});
