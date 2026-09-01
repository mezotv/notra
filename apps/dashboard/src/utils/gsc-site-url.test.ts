import { describe, expect, test } from "bun:test";

import { findMatchingGscSiteUrl, getGscSiteDomain } from "./gsc-site-url";

const site = (siteUrl: string) => ({ siteUrl, permissionLevel: "siteOwner" });

describe("getGscSiteDomain", () => {
  test("extracts domains from domain and URL-prefix properties", () => {
    expect(getGscSiteDomain("sc-domain:Example.com.")).toBe("example.com");
    expect(getGscSiteDomain("https://www.example.com/blog/")).toBe(
      "www.example.com"
    );
  });

  test("returns null for an invalid property", () => {
    expect(getGscSiteDomain("not a property")).toBeNull();
  });
});

describe("findMatchingGscSiteUrl", () => {
  test("matches the project's domain property", () => {
    expect(
      findMatchingGscSiteUrl(
        [site("sc-domain:example.com"), site("sc-domain:other.com")],
        "https://example.com/"
      )
    ).toBe("sc-domain:example.com");
  });

  test("matches a parent domain property for a project subdomain", () => {
    expect(
      findMatchingGscSiteUrl(
        [site("sc-domain:example.com")],
        "https://www.example.com/"
      )
    ).toBe("sc-domain:example.com");
  });

  test("prefers the most specific matching domain property", () => {
    expect(
      findMatchingGscSiteUrl(
        [site("sc-domain:example.com"), site("sc-domain:shop.example.com")],
        "https://shop.example.com/"
      )
    ).toBe("sc-domain:shop.example.com");
  });

  test("falls back to a URL-prefix property with the same origin", () => {
    expect(
      findMatchingGscSiteUrl(
        [site("http://example.com/"), site("https://example.com/")],
        "https://example.com/"
      )
    ).toBe("https://example.com/");
  });

  test("prefers the most specific URL-prefix property that covers the project", () => {
    expect(
      findMatchingGscSiteUrl(
        [
          site("https://example.com/"),
          site("https://example.com/blog/"),
          site("https://example.com/blog/guides/"),
        ],
        "https://example.com/blog/guides/getting-started"
      )
    ).toBe("https://example.com/blog/guides/");
  });

  test("does not match a different protocol or non-covering path", () => {
    expect(
      findMatchingGscSiteUrl(
        [site("http://example.com/"), site("https://example.com/docs/")],
        "https://example.com/blog/"
      )
    ).toBeNull();
  });

  test("does not match a lookalike or narrower domain", () => {
    expect(
      findMatchingGscSiteUrl(
        [site("sc-domain:notexample.com"), site("sc-domain:www.example.com")],
        "https://example.com/"
      )
    ).toBeNull();
  });

  test("returns null without a valid project website", () => {
    expect(
      findMatchingGscSiteUrl([site("sc-domain:example.com")], null)
    ).toBeNull();
    expect(
      findMatchingGscSiteUrl([site("sc-domain:example.com")], "not a url")
    ).toBeNull();
  });
});
