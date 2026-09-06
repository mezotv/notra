import { describe, expect, test } from "bun:test";

import { scopeGeoScanEngines } from "../src/utils/geo-engines";

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
