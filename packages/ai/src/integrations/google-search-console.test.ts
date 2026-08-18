import { describe, expect, test } from "bun:test";
import { hasGscGoogleAccountChanged } from "./google-search-console";

describe("hasGscGoogleAccountChanged", () => {
  test("does not treat a missing or blank email as a new Google account", () => {
    expect(hasGscGoogleAccountChanged("owner@example.com", null)).toBe(false);
    expect(hasGscGoogleAccountChanged(null, "owner@example.com")).toBe(false);
    expect(hasGscGoogleAccountChanged(undefined, "owner@example.com")).toBe(
      false
    );
    expect(hasGscGoogleAccountChanged("owner@example.com", "   ")).toBe(false);
  });

  test("treats case and surrounding whitespace as the same account", () => {
    expect(
      hasGscGoogleAccountChanged("  Owner@Example.com ", "owner@example.com")
    ).toBe(false);
  });
});
