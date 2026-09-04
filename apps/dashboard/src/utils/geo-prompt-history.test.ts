import { describe, expect, test } from "bun:test";

import type { GeoPromptHistoryCheck } from "@notra/geo-core/types/geo";

import {
  formatPromptHistoryNames,
  promptHistoryChanges,
  promptHistoryChangeText,
  promptResultFromHistoryCheck,
} from "./geo-prompt-history";

function check(
  overrides: Partial<GeoPromptHistoryCheck> & { capturedAt: string }
): GeoPromptHistoryCheck {
  return {
    id: overrides.capturedAt,
    scanId: `scan-${overrides.capturedAt}`,
    engine: "anthropic/claude-sonnet",
    language: "English",
    mentioned: false,
    position: null,
    sentiment: null,
    competitors: [],
    answer: "",
    excerpt: "",
    searchQueries: [],
    sources: [],
    ...overrides,
  };
}

describe("promptHistoryChanges", () => {
  test("describes a gained mention with its position and new brands", () => {
    const [latest] = promptHistoryChanges([
      check({ capturedAt: "2026-08-29T11:41:00Z", competitors: ["HubSpot"] }),
      check({
        capturedAt: "2026-08-30T11:41:00Z",
        mentioned: true,
        position: 1,
        competitors: ["HubSpot", "Pipedrive", "Jira"],
      }),
    ]);
    expect(latest?.changes).toEqual([{ kind: "gained", position: 1 }]);
    expect(latest?.newCompetitors).toEqual(["Pipedrive", "Jira"]);
  });

  test("describes a position move and a lost mention", () => {
    const entries = promptHistoryChanges([
      check({
        capturedAt: "2026-08-27T11:41:00Z",
        mentioned: true,
        position: 2,
      }),
      check({
        capturedAt: "2026-08-28T11:41:00Z",
        mentioned: true,
        position: 4,
      }),
      check({ capturedAt: "2026-08-29T11:41:00Z" }),
    ]);
    expect(entries[0]?.changes).toEqual([{ kind: "lost" }]);
    expect(entries[1]?.changes).toEqual([{ kind: "position", from: 2, to: 4 }]);
  });

  test("marks unchanged scans and the first scan", () => {
    const entries = promptHistoryChanges([
      check({
        capturedAt: "2026-08-21T11:41:00Z",
        mentioned: true,
        position: 1,
        competitors: ["Notion"],
      }),
      check({
        capturedAt: "2026-08-22T11:41:00Z",
        mentioned: true,
        position: 1,
        competitors: ["Notion"],
      }),
    ]);
    expect(entries[0]?.changes).toEqual([{ kind: "none" }]);
    expect(entries[0]?.newCompetitors).toEqual([]);
    expect(entries[1]?.changes).toEqual([{ kind: "first" }]);
    expect(entries[1]?.newCompetitors).toEqual([]);
  });
});

describe("formatPromptHistoryNames", () => {
  test("joins names as an English list", () => {
    expect(formatPromptHistoryNames(["Pipedrive"])).toBe("Pipedrive");
    expect(formatPromptHistoryNames(["Pipedrive", "Jira"])).toBe(
      "Pipedrive and Jira"
    );
    expect(formatPromptHistoryNames(["Pipedrive", "Jira", "Linear"])).toBe(
      "Pipedrive, Jira, and Linear"
    );
  });
});

describe("promptHistoryChangeText", () => {
  test("joins changes into one readable line", () => {
    expect(
      promptHistoryChangeText({
        changes: [{ kind: "gained", position: 1 }],
        newCompetitors: ["Pipedrive", "Jira"],
      })
    ).toBe("Now mentioned at #1. Pipedrive and Jira newly recommended.");
    expect(
      promptHistoryChangeText({
        changes: [{ kind: "position", from: 2, to: null }],
        newCompetitors: [],
      })
    ).toBe("Moved #2 → Not ranked.");
    expect(
      promptHistoryChangeText({
        changes: [{ kind: "none" }],
        newCompetitors: [],
      })
    ).toBe("No change");
  });
});

describe("promptResultFromHistoryCheck", () => {
  test("carries the captured answer and scan time into a result", () => {
    const result = promptResultFromHistoryCheck(
      check({
        capturedAt: "2026-08-27T11:41:00Z",
        mentioned: true,
        position: 2,
        answer: "Notra is a solid pick.",
        competitors: ["Notion"],
      }),
      "prompt-1",
      "How can I improve AI search visibility?"
    );
    expect(result.promptId).toBe("prompt-1");
    expect(result.prompt).toBe("How can I improve AI search visibility?");
    expect(result.answer).toBe("Notra is a solid pick.");
    expect(result.position).toBe(2);
    expect(result.competitors).toEqual(["Notion"]);
    expect(result.lastCheckedAt).toBe("2026-08-27T11:41:00Z");
  });
});
