import { describe, expect, test } from "bun:test";

import { formatGeoSource, sparklineTrend } from "@/utils/ai-traffic";

describe("formatGeoSource", () => {
  test("labels lowercase vendor slugs for any visitor type", () => {
    expect(formatGeoSource("google")).toBe("Gemini");
    expect(formatGeoSource("perplexity")).toBe("Perplexity");
    expect(formatGeoSource("anthropic")).toBe("Claude");
    expect(formatGeoSource("openai")).toBe("ChatGPT");
  });

  test("labels assistant referral slugs", () => {
    expect(formatGeoSource("chatgpt")).toBe("ChatGPT");
    expect(formatGeoSource("you")).toBe("You.com");
    expect(formatGeoSource("copilot")).toBe("Copilot");
  });

  test("matches case-insensitively and trims whitespace", () => {
    expect(formatGeoSource(" Gemini ")).toBe("Gemini");
    expect(formatGeoSource("PERPLEXITY")).toBe("Perplexity");
  });

  test("keeps agent names untouched", () => {
    expect(formatGeoSource("PerplexityBot")).toBe("PerplexityBot");
    expect(formatGeoSource("ChatGPT-User")).toBe("ChatGPT-User");
    expect(formatGeoSource("Claude Code")).toBe("Claude Code");
    expect(formatGeoSource("Google-Extended")).toBe("Google-Extended");
  });
});

function series(values: readonly number[]): { value: number }[] {
  return values.map((value) => ({ value }));
}

describe("sparklineTrend", () => {
  test("follows the overall direction across the window", () => {
    expect(sparklineTrend(series([2, 3, 3, 5, 6, 8, 9, 12]))).toBe("up");
    expect(sparklineTrend(series([12, 9, 8, 6, 5, 3, 3, 2]))).toBe("down");
  });

  test("stays up when the last days dip after a long climb", () => {
    expect(
      sparklineTrend(series([1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 15, 14]))
    ).toBe("up");
  });

  test("is flat for noise around a level", () => {
    expect(sparklineTrend(series([5, 6, 5, 5, 6, 5, 5, 6]))).toBe("flat");
    expect(sparklineTrend(series([0, 0, 0, 0]))).toBe("flat");
  });
});
