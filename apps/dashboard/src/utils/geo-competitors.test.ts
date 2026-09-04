import { describe, expect, test } from "bun:test";

import { OWN_BRAND_ROW_ID } from "@notra/geo-core/constants/geo";
import type { GeoPromptResult } from "@notra/geo-core/types/geo";

import { engineFamilyBrandRows } from "./geo-competitors";

const baseResult: GeoPromptResult = {
  promptId: "prompt-1",
  engine: "openai/gpt-5",
  prompt: "Which product should I use?",
  answer: "",
  mentioned: false,
  position: null,
  sentiment: null,
  competitors: [],
  excerpt: "",
  searchQueries: [],
  sources: [],
  finishReason: null,
  promptTokens: null,
  outputTokens: null,
  reasoningTokens: null,
  truncated: null,
  lastCheckedAt: "2026-09-04T08:00:00Z",
};

describe("engineFamilyBrandRows", () => {
  test("counts each brand at most once per prompt", () => {
    const rows = engineFamilyBrandRows(
      "openai",
      [
        {
          ...baseResult,
          mentioned: true,
          competitors: ["Rival alias"],
        },
        {
          ...baseResult,
          engine: "openai/gpt-4o",
          competitors: ["Rival"],
        },
        {
          ...baseResult,
          promptId: "prompt-2",
          engine: "openai/gpt-4o",
          prompt: "What is another option?",
        },
      ],
      {
        companyName: "Notra",
        competitors: [
          {
            id: "rival-1",
            name: "Rival",
            domain: "rival.example",
            synonyms: ["Rival alias"],
            kind: "direct",
            color: null,
          },
        ],
      }
    );

    expect(rows).toEqual([
      {
        key: OWN_BRAND_ROW_ID,
        name: "Notra",
        mentions: 1,
        share: 0.5,
        own: true,
      },
      {
        key: "rival",
        name: "Rival",
        mentions: 1,
        share: 0.5,
        own: false,
      },
    ]);
  });
});
