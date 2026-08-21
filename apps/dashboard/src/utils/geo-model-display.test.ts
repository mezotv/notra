import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatModelLabel } from "./geo-model-display";

describe("formatModelLabel", () => {
  test("keeps version tokens readable", () => {
    assert.equal(formatModelLabel("openai/gpt-4o-mini"), "GPT-4o mini");
    assert.equal(formatModelLabel("openai/o3-mini"), "o3 mini");
    assert.equal(formatModelLabel("qwen/qwen3-coder"), "Qwen3 Coder");
    assert.equal(formatModelLabel("openai/gpt-5.4-turbo"), "GPT-5.4 Turbo");
  });

  test("prefers curated engine labels for tracked engines", () => {
    assert.equal(formatModelLabel("openai/gpt-5.4"), "GPT-5.4");
    assert.equal(formatModelLabel("openai/gpt-5.4-mini"), "GPT-5.4 mini");
    assert.equal(
      formatModelLabel("anthropic/claude-sonnet-5"),
      "Claude Sonnet 5"
    );
    assert.equal(formatModelLabel("anthropic/claude-opus-5"), "Claude Opus 5");
    assert.equal(
      formatModelLabel("anthropic/claude-haiku-4.5"),
      "Claude Haiku 4.5"
    );
    assert.equal(
      formatModelLabel("anthropic/claude-sonnet-4.6-grounded"),
      "Claude"
    );
  });
});
