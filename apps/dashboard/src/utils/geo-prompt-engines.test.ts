import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { adjacentPromptEngine } from "@/utils/geo-prompt-engines";

const ENGINES = [
  "openai/gpt-5.4",
  "openai/gpt-5.4-grounded",
  "google/gemini-3-flash",
  "google/gemini-3-flash-grounded",
] as const;

describe("adjacentPromptEngine", () => {
  test("steps through search and raw answers as separate engines", () => {
    assert.equal(
      adjacentPromptEngine(ENGINES, "openai/gpt-5.4", 1),
      "openai/gpt-5.4-grounded"
    );
    assert.equal(
      adjacentPromptEngine(ENGINES, "openai/gpt-5.4-grounded", 1),
      "google/gemini-3-flash"
    );
    assert.equal(
      adjacentPromptEngine(ENGINES, "google/gemini-3-flash", -1),
      "openai/gpt-5.4-grounded"
    );
  });

  test("wraps around the list", () => {
    assert.equal(
      adjacentPromptEngine(ENGINES, "google/gemini-3-flash-grounded", 1),
      "openai/gpt-5.4"
    );
    assert.equal(
      adjacentPromptEngine(ENGINES, "openai/gpt-5.4", -1),
      "google/gemini-3-flash-grounded"
    );
  });
});
