import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildLanguagePerformanceRows,
  trackedGeoLanguages,
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
      configuredLanguages: ["English", "German", "Spanish", "French"],
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

describe("trackedGeoLanguages", () => {
  test("keeps English as a regular, removable language", () => {
    assert.deepEqual(trackedGeoLanguages(["German", "English"]), [
      "German",
      "English",
    ]);
    assert.deepEqual(trackedGeoLanguages(["German"]), ["German"]);
  });

  test("falls back to English when nothing is configured", () => {
    assert.deepEqual(trackedGeoLanguages([]), ["English"]);
  });
});

describe("withAddedGeoLanguage", () => {
  test("returns null at the language cap", () => {
    assert.equal(
      withAddedGeoLanguage(
        ["English", "German", "Spanish", "French"],
        "Portuguese"
      ),
      null
    );
  });

  test("can add English back", () => {
    assert.deepEqual(withAddedGeoLanguage(["German"], "English"), [
      "German",
      "English",
    ]);
  });
});

describe("withRemovedGeoLanguage", () => {
  test("can drop English when another language remains", () => {
    assert.deepEqual(withRemovedGeoLanguage(["English", "German"], "English"), [
      "German",
    ]);
  });

  test("refuses to drop the last language", () => {
    assert.equal(withRemovedGeoLanguage(["English"], "English"), null);
  });
});
