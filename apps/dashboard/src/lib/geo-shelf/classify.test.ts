import { describe, expect, test } from "bun:test";

import { shelfKindFromDomain, shelfOwnershipFromDomain } from "./classify";

describe("shelfKindFromDomain", () => {
  test("labels Reddit as community", () => {
    expect(shelfKindFromDomain("reddit.com")).toBe("community");
    expect(shelfKindFromDomain("old.reddit.com")).toBe("community");
  });

  test("labels review, video, news and docs hosts", () => {
    expect(shelfKindFromDomain("g2.com")).toBe("review_site");
    expect(shelfKindFromDomain("youtube.com")).toBe("video");
    expect(shelfKindFromDomain("techcrunch.com")).toBe("news");
    expect(shelfKindFromDomain("docs.stripe.com")).toBe("docs");
  });

  test("falls back to other", () => {
    expect(shelfKindFromDomain("example.com")).toBe("other");
  });
});

describe("shelfOwnershipFromDomain", () => {
  test("marks the project domain and its subdomains as own", () => {
    expect(
      shelfOwnershipFromDomain("acme.com", "https://www.acme.com", [])
    ).toBe("own");
    expect(shelfOwnershipFromDomain("docs.acme.com", "acme.com", [])).toBe(
      "own"
    );
  });

  test("marks competitor domains as competitor", () => {
    expect(
      shelfOwnershipFromDomain("rival.dev", "acme.com", ["https://rival.dev"])
    ).toBe("competitor");
  });

  test("everything else is third party", () => {
    expect(
      shelfOwnershipFromDomain("reddit.com", "acme.com", ["rival.dev"])
    ).toBe("third_party");
  });
});
