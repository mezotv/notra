import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildLanguagePerformanceRows,
  withAddedGeoLanguage,
  withRemovedGeoLanguage,
} from "./geo-language-rows";

describe("buildLanguagePerformanceRows", () => {
  test("still fills remaining slots when extras are at the language cap", () => {
    const rows = buildLanguagePerformanceRows({
      points: [
        {
          language: "German",
          checks: 10,
          mentions: 5,
          mentionRate: 0.5,
          avgPosition: 2,
        },
        {
          language: "English",
          checks: 10,
          mentions: 5,
          mentionRate: 0.46,
          avgPosition: 2,
        },
      ],
      configuredLanguages: ["German", "Spanish", "French"],
      slotCount: 6,
    });

    assert.deepEqual(
      rows.map((row) => `${row.kind}:${row.language}`),
      [
        "tracked:German",
        "tracked:English",
        "tracked:Spanish",
        "tracked:French",
        "suggested:Portuguese",
        "suggested:Dutch",
      ]
    );
  });
});

describe("withAddedGeoLanguage", () => {
  test("returns null at the extra-language cap", () => {
    assert.equal(
      withAddedGeoLanguage(["German", "Spanish", "French"], "Portuguese"),
      null
    );
  });
});

describe("withRemovedGeoLanguage", () => {
  test("refuses to drop English", () => {
    assert.equal(withRemovedGeoLanguage(["German"], "English"), null);
  });
});
