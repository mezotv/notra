import { describe, expect, test } from "bun:test";

import {
  scanPreflightEngineNames,
  scanPreflightEnginesToSubmit,
} from "./geo-scan-preflight";

const TRACKED = [
  "anthropic/claude-sonnet-5",
  "openai/gpt-5.6-sol",
  "google/gemini-3.5-flash",
];

describe("scanPreflightEnginesToSubmit", () => {
  test("omits the payload when every tracked engine is selected", () => {
    expect(
      scanPreflightEnginesToSubmit(TRACKED, new Set(TRACKED))
    ).toBeUndefined();
  });

  test("returns the selected subset in tracked order", () => {
    expect(
      scanPreflightEnginesToSubmit(
        TRACKED,
        new Set(["google/gemini-3.5-flash", "anthropic/claude-sonnet-5"])
      )
    ).toEqual(["anthropic/claude-sonnet-5", "google/gemini-3.5-flash"]);
  });

  test("omits the payload when nothing valid is selected", () => {
    expect(scanPreflightEnginesToSubmit(TRACKED, new Set())).toBeUndefined();
  });
});

describe("scanPreflightEngineNames", () => {
  test("labels each engine without repeating a family", () => {
    expect(scanPreflightEngineNames(TRACKED)).toEqual([
      "Claude Sonnet 5",
      "GPT-5.6 Sol",
      "Gemini 3.5 Flash",
    ]);
  });
});
