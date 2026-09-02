import { describe, expect, test } from "bun:test";

import { getWebsiteUrlLookupVariants } from "./geo-website";

describe("getWebsiteUrlLookupVariants", () => {
  test("adds a trailing-slash variant to a suffix-free URL", () => {
    const variants = getWebsiteUrlLookupVariants("https://example.com");

    expect(variants.join(",")).toBe("https://example.com,https://example.com/");
  });

  test("adds a non-trailing-slash variant to a suffix-free URL", () => {
    const variants = getWebsiteUrlLookupVariants("https://example.com/");

    expect(variants.join(",")).toBe("https://example.com/,https://example.com");
  });

  test("keeps query and fragment suffixes after the slash variant", () => {
    const queryVariants = getWebsiteUrlLookupVariants(
      "https://example.com?view=all"
    );
    const fragmentVariants = getWebsiteUrlLookupVariants(
      "https://example.com/#details"
    );

    expect(queryVariants.join(",")).toBe(
      "https://example.com?view=all,https://example.com/?view=all"
    );
    expect(fragmentVariants.join(",")).toBe(
      "https://example.com/#details,https://example.com#details"
    );
  });
});
