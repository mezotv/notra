import { describe, expect, test } from "bun:test";

import { normalizeWebsiteUrl, stripWebsiteProtocol } from "./geo-website";

describe("stripWebsiteProtocol", () => {
  test("removes a trailing slash from the pathname", () => {
    expect(stripWebsiteProtocol("https://example.com/path/")).toBe(
      "example.com/path"
    );
  });

  test("preserves URLs containing a query or fragment", () => {
    expect(stripWebsiteProtocol("https://example.com/path/?page=1")).toBe(
      "example.com/path/?page=1"
    );
    expect(stripWebsiteProtocol("https://example.com?next=/docs/")).toBe(
      "example.com?next=/docs/"
    );
    expect(stripWebsiteProtocol("https://example.com#section/")).toBe(
      "example.com#section/"
    );
  });
});

describe("normalizeWebsiteUrl", () => {
  test("preserves trailing slashes in URL parameters", () => {
    expect(normalizeWebsiteUrl("example.com?next=/docs/")).toBe(
      "https://example.com?next=/docs/"
    );
    expect(normalizeWebsiteUrl("http://example.com#section/")).toBe(
      "https://example.com#section/"
    );
  });
});
