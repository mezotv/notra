import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isGeoRange } from "./geo-range";

describe("isGeoRange", () => {
  test("accepts the page range presets", () => {
    assert.equal(isGeoRange("24h"), true);
    assert.equal(isGeoRange("7d"), true);
    assert.equal(isGeoRange("14d"), true);
    assert.equal(isGeoRange("30d"), true);
  });

  test("rejects unknown values", () => {
    assert.equal(isGeoRange("90d"), false);
    assert.equal(isGeoRange(""), false);
  });
});
