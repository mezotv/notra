import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { GeoPromptResult } from "@/types/geo";
import {
  engineFamilyPromptHits,
  promptTableRowForId,
} from "@/utils/geo-prompts";

function result(
  overrides: Partial<GeoPromptResult> &
    Pick<GeoPromptResult, "promptId" | "engine" | "mentioned">
): GeoPromptResult {
  return {
    prompt: overrides.prompt ?? overrides.promptId,
    answer: "",
    position: null,
    sentiment: null,
    excerpt: "",
    lastCheckedAt: "2026-08-24T09:41:00Z",
    ...overrides,
  };
}

describe("engineFamilyPromptHits", () => {
  test("keeps one row per prompt and prefers misses first", () => {
    const rows = engineFamilyPromptHits("perplexity", [
      result({
        promptId: "hit",
        prompt: "Best tools",
        engine: "perplexity",
        mentioned: true,
        position: 2,
      }),
      result({
        promptId: "miss",
        prompt: "Hidden brand",
        engine: "perplexity",
        mentioned: false,
      }),
      result({
        promptId: "other",
        prompt: "ChatGPT only",
        engine: "openai",
        mentioned: true,
        position: 1,
      }),
    ]);

    assert.deepEqual(
      rows.map((row) => ({
        promptId: row.promptId,
        mentioned: row.mentioned,
        position: row.position,
      })),
      [
        { promptId: "miss", mentioned: false, position: null },
        { promptId: "hit", mentioned: true, position: 2 },
      ]
    );
  });

  test("uses the best position when search and memory both ran", () => {
    const rows = engineFamilyPromptHits("openai", [
      result({
        promptId: "p1",
        prompt: "Compare writers",
        engine: "gpt-4o",
        mentioned: true,
        position: 4,
      }),
      result({
        promptId: "p1",
        prompt: "Compare writers",
        engine: "gpt-4o-grounded",
        mentioned: true,
        position: 1,
      }),
    ]);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.mentioned, true);
    assert.equal(rows[0]?.position, 1);
  });
});

describe("promptTableRowForId", () => {
  test("collects every engine result for the prompt", () => {
    const results = [
      result({
        promptId: "p1",
        prompt: "Compare writers",
        engine: "perplexity",
        mentioned: true,
        position: 3,
      }),
      result({
        promptId: "p1",
        prompt: "Compare writers",
        engine: "openai",
        mentioned: false,
      }),
      result({
        promptId: "p2",
        prompt: "Other",
        engine: "perplexity",
        mentioned: false,
      }),
    ];

    const row = promptTableRowForId("p1", results);
    assert.equal(row?.prompt, "Compare writers");
    assert.equal(row?.mentioned, 1);
    assert.equal(row?.total, 2);
    assert.equal(row?.bestPosition, 3);
    assert.equal(row?.results.length, 2);
  });
});
