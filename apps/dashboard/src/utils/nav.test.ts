import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { GEO_WRITER_NAV_LINK } from "@/constants/geo";
import { IRIS_NAV_LINK } from "@/constants/iris";
import {
  ANALYTICS_NAV_LINK,
  CONTENT_NAV_LINK,
  GEO_OVERVIEW_NAV_LINK,
  HOME_NAV_LINK,
  NAV_AUTOMATION_LINKS,
  NAV_GEO_IMPROVE_LINKS,
  NAV_STUDIO_LINKS,
} from "@/constants/nav";
import {
  isSidebarMode,
  isStaleGeoProjectParam,
  resolveActiveNavLink,
  resolveGeoImproveLinks,
  resolveNavItems,
  resolveSidebarMode,
} from "@/utils/nav";

describe("resolveSidebarMode", () => {
  test("GEO routes always resolve to geo", () => {
    assert.equal(resolveSidebarMode("geo", "studio"), "geo");
  });

  test("studio routes and home always resolve to studio", () => {
    assert.equal(resolveSidebarMode("content", "geo"), "studio");
    assert.equal(resolveSidebarMode(undefined, "geo"), "studio");
  });

  test("shared routes keep the stored mode", () => {
    assert.equal(resolveSidebarMode("settings", "studio"), "studio");
    assert.equal(resolveSidebarMode("integrations", "geo"), "geo");
  });

  test("shared routes default to geo without a stored mode", () => {
    assert.equal(resolveSidebarMode("settings", null), "geo");
  });
});

describe("isSidebarMode", () => {
  test("accepts only known modes", () => {
    assert.equal(isSidebarMode("geo"), true);
    assert.equal(isSidebarMode("studio"), true);
    assert.equal(isSidebarMode("other"), false);
    assert.equal(isSidebarMode(null), false);
  });
});

describe("resolveNavItems", () => {
  test("keeps link order and drops unknown links", () => {
    const items = resolveNavItems([CONTENT_NAV_LINK, "/nope", HOME_NAV_LINK]);
    assert.deepEqual(
      items.map((item) => item.link),
      [CONTENT_NAV_LINK, HOME_NAV_LINK]
    );
  });

  test("hides flag-gated items", () => {
    const studio = resolveNavItems(NAV_STUDIO_LINKS, {
      iris: false,
      writer: false,
      analytics: false,
    });
    assert.equal(
      studio.some((item) => item.link === ANALYTICS_NAV_LINK),
      false
    );

    const automation = resolveNavItems(NAV_AUTOMATION_LINKS, {
      iris: false,
      writer: true,
      analytics: true,
    });
    assert.equal(
      automation.some((item) => item.link === IRIS_NAV_LINK),
      false
    );

    const improve = resolveNavItems(NAV_GEO_IMPROVE_LINKS, {
      iris: true,
      writer: false,
      analytics: true,
    });
    assert.equal(
      improve.some((item) => item.link === GEO_WRITER_NAV_LINK),
      false
    );
  });
});

describe("resolveGeoImproveLinks", () => {
  test("removes Write when it is the primary action", () => {
    assert.equal(
      resolveGeoImproveLinks(true).includes(GEO_WRITER_NAV_LINK),
      false
    );
    assert.equal(
      resolveGeoImproveLinks(false).includes(GEO_WRITER_NAV_LINK),
      true
    );
  });
});

describe("resolveActiveNavLink", () => {
  test("prefers the longest matching link", () => {
    assert.equal(
      resolveActiveNavLink("/acme/geo/prompts", "acme", [
        GEO_OVERVIEW_NAV_LINK,
        "/geo/prompts",
      ]),
      "/geo/prompts"
    );
  });

  test("matches home only on the org root", () => {
    assert.equal(
      resolveActiveNavLink("/acme", "acme", [HOME_NAV_LINK, CONTENT_NAV_LINK]),
      HOME_NAV_LINK
    );
    assert.equal(
      resolveActiveNavLink("/acme/content/123", "acme", [
        HOME_NAV_LINK,
        CONTENT_NAV_LINK,
      ]),
      CONTENT_NAV_LINK
    );
  });
});

describe("isStaleGeoProjectParam", () => {
  test("is stale only when a param is set and missing from the list", () => {
    assert.equal(isStaleGeoProjectParam(["a", "b"], "c"), true);
    assert.equal(isStaleGeoProjectParam(["a", "b"], "b"), false);
    assert.equal(isStaleGeoProjectParam(["a", "b"], null), false);
    assert.equal(isStaleGeoProjectParam([], null), false);
  });
});
