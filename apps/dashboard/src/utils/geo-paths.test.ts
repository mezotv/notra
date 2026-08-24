import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  geoDashboardPath,
  geoNavHref,
  isGeoDashboardPath,
  withGeoProject,
} from "@/utils/geo-paths";

describe("withGeoProject", () => {
  test("keeps the selected project on a GEO path", () => {
    assert.equal(
      withGeoProject("/acme/geo/traffic", "project-2"),
      "/acme/geo/traffic?project=project-2"
    );
  });

  test("preserves existing query parameters", () => {
    assert.equal(
      withGeoProject("/acme/geo/prompts?range=30d", "project&2"),
      "/acme/geo/prompts?range=30d&project=project%262"
    );
  });

  test("leaves the path unchanged without a selected project", () => {
    assert.equal(withGeoProject("/acme/geo", undefined), "/acme/geo");
  });
});

describe("isGeoDashboardPath", () => {
  test("matches GEO dashboard routes", () => {
    assert.equal(isGeoDashboardPath("/acme/geo"), true);
    assert.equal(isGeoDashboardPath("/acme/geo/traffic"), true);
    assert.equal(isGeoDashboardPath("/acme/geo?project=1"), true);
  });

  test("ignores unrelated routes", () => {
    assert.equal(isGeoDashboardPath("/acme/content"), false);
    assert.equal(isGeoDashboardPath("/acme/geolocation"), false);
  });
});

describe("geoNavHref", () => {
  test("keeps the selected GEO project on sidebar links", () => {
    assert.equal(
      geoNavHref("acme", "/geo/traffic", "project-2"),
      "/acme/geo/traffic?project=project-2"
    );
  });

  test("leaves non-GEO links unchanged", () => {
    assert.equal(geoNavHref("acme", "/content", "project-2"), "/acme/content");
  });
});

describe("geoDashboardPath", () => {
  test("includes the selected project", () => {
    assert.equal(
      geoDashboardPath("acme", "project-2"),
      "/acme/geo?project=project-2"
    );
  });
});
