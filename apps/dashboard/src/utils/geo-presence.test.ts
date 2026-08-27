import { describe, expect, test } from "bun:test";

import type { GeoPromptResult } from "@/types/geo";
import {
  scannedEngineFamilies,
  summarizePromptResults,
  unseenPromptSummaries,
} from "@/utils/geo-presence";
import { bestMentionedResult } from "@/utils/geo-prompts";

function check(
  promptId: string,
  mentioned: boolean,
  extras: Partial<GeoPromptResult> = {}
): GeoPromptResult {
  return {
    promptId,
    engine: extras.engine ?? "openai/gpt-5.4",
    prompt: extras.prompt ?? promptId,
    answer: extras.answer ?? "",
    mentioned,
    position: extras.position ?? null,
    sentiment: extras.sentiment ?? (mentioned ? "neutral" : null),
    excerpt: extras.excerpt ?? "",
    searchQueries: extras.searchQueries ?? [],
    sources: extras.sources ?? [],
    lastCheckedAt: extras.lastCheckedAt ?? "2026-08-01T00:00:00.000Z",
  };
}

describe("unseenPromptSummaries", () => {
  test("returns only prompts with no mention, sorted by question", () => {
    const summaries = summarizePromptResults([
      check("zeta", false, { prompt: "zeta tools" }),
      check("alpha", true, { prompt: "alpha tools", position: 1 }),
      check("beta", false, { prompt: "beta tools" }),
    ]);

    expect(unseenPromptSummaries(summaries).map((row) => row.prompt)).toEqual([
      "beta tools",
      "zeta tools",
    ]);
  });
});

describe("scannedEngineFamilies", () => {
  test("includes engines that ran, even when they did not mention you", () => {
    const [summary] = summarizePromptResults([
      check("a", false, { engine: "openai/gpt-5.4" }),
      check("a", false, { engine: "anthropic/claude-sonnet-4.6" }),
    ]);

    expect(summary).toBeDefined();
    expect(scannedEngineFamilies(summary!)).toEqual(["openai", "claude"]);
  });
});

describe("bestMentionedResult", () => {
  test("picks the mentioned answer with the best rank", () => {
    const best = bestMentionedResult([
      check("a", true, { position: 5, excerpt: "fifth" }),
      check("a", false, { excerpt: "miss" }),
      check("a", true, { position: 1, excerpt: "first" }),
    ]);

    expect(best?.excerpt).toBe("first");
    expect(best?.position).toBe(1);
  });
});
