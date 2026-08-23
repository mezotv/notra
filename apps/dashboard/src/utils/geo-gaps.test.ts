import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { GEO_GAPS_ENGINE_FILTER_ALL } from "@/constants/geo";
import type { GeoPromptGapRow, GeoSearchGapRow } from "@/types/geo";
import { engineFamilyOf } from "@/utils/geo-charts";
import {
  filterPromptGaps,
  filterSearchGaps,
  geoGapsEmptyKind,
  uniqueGapEngineFamilies,
} from "@/utils/geo-gaps";

const OPENAI = "openai/gpt-5.4";
const CLAUDE = "anthropic/claude-sonnet-4.6";

function promptGap(
  overrides: Partial<GeoPromptGapRow> & Pick<GeoPromptGapRow, "id" | "prompt">
): GeoPromptGapRow {
  return {
    title: null,
    engines: [OPENAI],
    competitors: [],
    ownMentionRate: 0,
    engineCoverage: 1,
    opportunity: 1,
    brief: null,
    ...overrides,
  };
}

function searchGap(
  overrides: Partial<GeoSearchGapRow> & Pick<GeoSearchGapRow, "id" | "prompt">
): GeoSearchGapRow {
  return {
    title: null,
    impressions: 100,
    brief: null,
    ...overrides,
  };
}

describe("filterPromptGaps", () => {
  const rows = [
    promptGap({
      id: "crm",
      prompt: "best crm for startups",
      engines: [OPENAI, CLAUDE],
    }),
    promptGap({
      id: "seo",
      prompt: "seo tools for agencies",
      engines: [CLAUDE],
      brief: {
        briefId: "b1",
        status: "draft",
        postId: null,
        workingTitle: "Agency SEO software guide",
      },
    }),
  ];

  test("keeps every row when filters are idle", () => {
    assert.deepEqual(
      filterPromptGaps(rows, "", GEO_GAPS_ENGINE_FILTER_ALL).map(
        (row) => row.id
      ),
      ["crm", "seo"]
    );
  });

  test("matches prompt text and working titles", () => {
    assert.deepEqual(
      filterPromptGaps(rows, "crm", GEO_GAPS_ENGINE_FILTER_ALL).map(
        (row) => row.id
      ),
      ["crm"]
    );
    assert.deepEqual(
      filterPromptGaps(rows, "agency seo", GEO_GAPS_ENGINE_FILTER_ALL).map(
        (row) => row.id
      ),
      ["seo"]
    );
  });

  test("keeps rows missing the selected engine family", () => {
    const openaiFamily = engineFamilyOf(OPENAI);
    assert.deepEqual(
      filterPromptGaps(rows, "", openaiFamily).map((row) => row.id),
      ["crm"]
    );
  });
});

describe("filterSearchGaps", () => {
  test("filters queries by prompt text", () => {
    const rows = [
      searchGap({ id: "a", prompt: "ai writing assistant" }),
      searchGap({ id: "b", prompt: "keyword research tool" }),
    ];
    assert.deepEqual(
      filterSearchGaps(rows, "writing").map((row) => row.id),
      ["a"]
    );
  });
});

describe("uniqueGapEngineFamilies", () => {
  test("returns sorted unique families", () => {
    const families = uniqueGapEngineFamilies([
      promptGap({ id: "a", prompt: "a", engines: [OPENAI, CLAUDE] }),
      promptGap({ id: "b", prompt: "b", engines: [OPENAI] }),
    ]);
    assert.deepEqual(
      new Set(families),
      new Set([engineFamilyOf(OPENAI), engineFamilyOf(CLAUDE)])
    );
    assert.equal(families.length, 2);
  });
});

describe("geoGapsEmptyKind", () => {
  test("prefers no-matches when a filter hides existing rows", () => {
    assert.equal(
      geoGapsEmptyKind({
        tab: "prompt",
        hasScanData: true,
        isScanning: false,
        hasSourceRows: true,
        hasMatches: false,
      }),
      "no-matches"
    );
  });
});
