import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  geoPresetRange,
  geoRangeSpanDays,
  isGeoRangePreset,
  localDayString,
  parseGeoRangeParam,
  parseLocalDay,
  serializeGeoCustomRange,
  serializeGeoRangeState,
} from "./geo-range";

describe("isGeoRangePreset", () => {
  test("accepts the range presets", () => {
    assert.equal(isGeoRangePreset("today"), true);
    assert.equal(isGeoRangePreset("yesterday"), true);
    assert.equal(isGeoRangePreset("7d"), true);
    assert.equal(isGeoRangePreset("14d"), true);
    assert.equal(isGeoRangePreset("30d"), true);
    assert.equal(isGeoRangePreset("90d"), true);
    assert.equal(isGeoRangePreset("ytd"), true);
  });

  test("rejects unknown values", () => {
    assert.equal(isGeoRangePreset("24h"), false);
    assert.equal(isGeoRangePreset("custom"), false);
    assert.equal(isGeoRangePreset(""), false);
  });
});

describe("parseGeoRangeParam", () => {
  test("parses a preset value", () => {
    const state = parseGeoRangeParam("7d");
    assert.equal(state.preset, "7d");
    assert.equal(geoRangeSpanDays(state.range), 7);
  });

  test("parses a custom range", () => {
    const state = parseGeoRangeParam("custom_2026-05-03_2026-05-17");
    assert.equal(state.preset, "custom");
    assert.deepEqual(state.range, {
      dateFrom: "2026-05-03",
      dateTo: "2026-05-17",
    });
  });

  test("rejects an inverted custom range", () => {
    const state = parseGeoRangeParam("custom_2026-05-17_2026-05-03");
    assert.equal(state.preset, "30d");
  });

  test("falls back to the default preset", () => {
    const state = parseGeoRangeParam("24h");
    assert.equal(state.preset, "30d");
  });
});

describe("serializeGeoRangeState", () => {
  test("round-trips a custom range", () => {
    const range = { dateFrom: "2026-05-03", dateTo: "2026-05-17" };
    const param = serializeGeoCustomRange(range);
    assert.equal(param, "custom_2026-05-03_2026-05-17");
    assert.deepEqual(parseGeoRangeParam(param).range, range);
  });

  test("returns null for the default preset", () => {
    assert.equal(
      serializeGeoRangeState({ preset: "30d", range: geoPresetRange("30d") }),
      null
    );
  });

  test("returns the preset value for non-default presets", () => {
    assert.equal(
      serializeGeoRangeState({ preset: "ytd", range: geoPresetRange("ytd") }),
      "ytd"
    );
  });
});

describe("geoPresetRange", () => {
  test("today is a single-day range", () => {
    const range = geoPresetRange("today");
    assert.equal(range.dateFrom, range.dateTo);
    assert.equal(geoRangeSpanDays(range), 1);
  });

  test("last 30 days spans 30 days", () => {
    assert.equal(geoRangeSpanDays(geoPresetRange("30d")), 30);
  });

  test("year to date starts on January 1", () => {
    const range = geoPresetRange("ytd");
    assert.equal(range.dateFrom.slice(5), "01-01");
  });
});

describe("local day helpers", () => {
  test("round-trips a local day", () => {
    const day = "2026-02-28";
    assert.equal(localDayString(parseLocalDay(day)), day);
  });
});
