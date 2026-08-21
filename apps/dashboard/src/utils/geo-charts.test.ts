import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { chartKey } from "./chart-keys";
import {
  buildMentionTrendRows,
  engineFamilyTotals,
  engineVariantLabel,
  fitMentionTrendAverage,
  groupEngineFamilies,
  mentionTrendEmptyLabel,
} from "./geo-charts";

describe("fitMentionTrendAverage", () => {
  test("is the mean of the engines in the tooltip, not their sum", () => {
    const rows = [
      {
        day: "Aug 14",
        rawDay: "2026-08-14",
        chatgpt: 13,
        claude: 9,
        gemini: 8,
        perplexity: 3,
        mini: 0,
        haiku: 0,
        opus: 0,
      },
    ];

    assert.deepEqual(
      fitMentionTrendAverage(rows, [
        "chatgpt",
        "claude",
        "gemini",
        "perplexity",
        "mini",
        "haiku",
        "opus",
      ]),
      [33 / 4]
    );
  });
});

describe("mentionTrendEmptyLabel", () => {
  test("says no mentions when every visible engine is zero", () => {
    assert.equal(
      mentionTrendEmptyLabel({ chatgpt: 0, claude: 0 }, ["chatgpt", "claude"]),
      "No mentions"
    );
  });

  test("says not scanned when the day has no engine values", () => {
    assert.equal(
      mentionTrendEmptyLabel({ chatgpt: null, claude: null }, [
        "chatgpt",
        "claude",
      ]),
      "Not scanned"
    );
    assert.equal(mentionTrendEmptyLabel(undefined, ["chatgpt"]), "Not scanned");
  });
});

describe("buildMentionTrendRows", () => {
  test("plots each Claude model as its own series", () => {
    const { engines, rows } = buildMentionTrendRows([
      {
        day: "2026-08-18",
        engine: "anthropic/claude-sonnet-4.6",
        checks: 4,
        mentions: 2,
      },
      {
        day: "2026-08-18",
        engine: "anthropic/claude-opus-5",
        checks: 4,
        mentions: 1,
      },
      {
        day: "2026-08-18",
        engine: "anthropic/claude-haiku-4.5",
        checks: 4,
        mentions: 1,
      },
      {
        day: "2026-08-18",
        engine: "openai/gpt-5.4",
        checks: 4,
        mentions: 3,
      },
    ]);

    assert.deepEqual(engines, [
      "openai/gpt-5.4",
      "anthropic/claude-sonnet-4.6",
      "anthropic/claude-opus-5",
      "anthropic/claude-haiku-4.5",
    ]);
    assert.equal(rows[0]?.[chartKey("openai/gpt-5.4")], 3);
    assert.equal(rows[0]?.[chartKey("anthropic/claude-sonnet-4.6")], 2);
    assert.equal(rows[0]?.[chartKey("anthropic/claude-opus-5")], 1);
    assert.equal(rows[0]?.[chartKey("anthropic/claude-haiku-4.5")], 1);
    assert.equal(rows[0]?.claude, undefined);
  });
});

describe("engineVariantLabel", () => {
  test("strips the family prefix from Claude model names", () => {
    assert.equal(
      engineVariantLabel("anthropic/claude-sonnet-5", "Claude"),
      "Sonnet 5"
    );
  });

  test("names the ChatGPT flagship by model so it does not repeat the family", () => {
    assert.equal(engineVariantLabel("openai/gpt-5.4", "ChatGPT"), "GPT-5.4");
    assert.equal(
      engineVariantLabel("openai/gpt-5.4-mini", "ChatGPT"),
      "GPT-5.4 mini"
    );
  });
});

describe("groupEngineFamilies", () => {
  test("keeps Claude models as variants under one family", () => {
    const families = groupEngineFamilies([
      {
        engine: "anthropic/claude-sonnet-4.6",
        checks: 10,
        mentions: 5,
        mentionRate: 0.5,
        avgPosition: 3,
        lastCheckedAt: "2026-08-20T10:00:00Z",
      },
      {
        engine: "anthropic/claude-opus-5",
        checks: 8,
        mentions: 6,
        mentionRate: 0.75,
        avgPosition: 2,
        lastCheckedAt: "2026-08-20T11:00:00Z",
      },
      {
        engine: "anthropic/claude-haiku-4.5-grounded",
        checks: 8,
        mentions: 2,
        mentionRate: 0.25,
        avgPosition: 4,
        lastCheckedAt: "2026-08-20T09:00:00Z",
      },
    ]);

    assert.equal(families.length, 1);
    assert.equal(families[0]?.family, "claude");
    assert.deepEqual(
      families[0]?.variants.map((variant) => variant.model),
      [
        "anthropic/claude-opus-5",
        "anthropic/claude-sonnet-4.6",
        "anthropic/claude-haiku-4.5",
      ]
    );
    assert.deepEqual(engineFamilyTotals(families[0]!), {
      mentions: 13,
      checks: 26,
      rate: 13 / 26,
    });
  });

  test("orders families by blended mention rate, not peak variant", () => {
    const families = groupEngineFamilies([
      {
        engine: "openai/gpt-5.4",
        checks: 10,
        mentions: 8,
        mentionRate: 0.8,
        avgPosition: 2,
        lastCheckedAt: "2026-08-20T10:00:00Z",
      },
      {
        engine: "openai/gpt-4o",
        checks: 10,
        mentions: 2,
        mentionRate: 0.2,
        avgPosition: 4,
        lastCheckedAt: "2026-08-20T09:00:00Z",
      },
      {
        engine: "perplexity/sonar",
        checks: 10,
        mentions: 6,
        mentionRate: 0.6,
        avgPosition: 3,
        lastCheckedAt: "2026-08-20T11:00:00Z",
      },
    ]);

    assert.deepEqual(
      families.map((family) => family.family),
      ["perplexity", "openai"]
    );
  });
});
