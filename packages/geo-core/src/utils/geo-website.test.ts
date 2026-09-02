import { describe, expect, test } from "bun:test";

import {
  getWebsiteUrlLookupVariants,
  normalizeWebsiteUrl,
  stripWebsiteProtocol,
} from "./geo-website";

describe("stripWebsiteProtocol", () => {
  test("removes a trailing slash from the pathname", () => {
    expect(stripWebsiteProtocol("https://example.com/path/")).toBe(
      "example.com/path"
    );
  });

  test("preserves URLs containing a query or fragment", () => {
    expect(stripWebsiteProtocol("https://example.com/path/?page=1")).toBe(
      "example.com/path?page=1"
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

describe("getWebsiteUrlLookupVariants", () => {
  test("includes the legacy slash before a URL suffix", () => {
    const queryVariants = getWebsiteUrlLookupVariants(
      "https://example.com/path?page=1"
    );
    expect(queryVariants.length).toBe(2);
    expect(queryVariants[0]).toBe("https://example.com/path?page=1");
    expect(queryVariants[1]).toBe("https://example.com/path/?page=1");

    const fragmentVariants = getWebsiteUrlLookupVariants(
      "https://example.com#section"
    );
    expect(fragmentVariants.length).toBe(2);
    expect(fragmentVariants[0]).toBe("https://example.com#section");
    expect(fragmentVariants[1]).toBe("https://example.com/#section");
  });

  test("does not add a variant when normalization did not remove a slash", () => {
    const suffixlessVariants = getWebsiteUrlLookupVariants(
      "https://example.com/path"
    );
    expect(suffixlessVariants.length).toBe(1);
    expect(suffixlessVariants[0]).toBe("https://example.com/path");

    const slashVariants = getWebsiteUrlLookupVariants(
      "https://example.com/path/?page=1"
    );
    expect(slashVariants.length).toBe(1);
    expect(slashVariants[0]).toBe("https://example.com/path/?page=1");
  });
});
