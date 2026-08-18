import { describe, expect, test } from "bun:test";
import { hasGscGoogleAccountChanged } from "./google-search-console";

describe("hasGscGoogleAccountChanged", () => {
  test("is false when the same Google account reconnects", () => {
    expect(
      hasGscGoogleAccountChanged("owner@example.com", "owner@example.com")
    ).toBe(false);
  });

  test("ignores case and surrounding whitespace", () => {
    expect(
      hasGscGoogleAccountChanged("  Owner@Example.com ", "owner@example.com")
    ).toBe(false);
  });

  test("is true when a different Google account reconnects", () => {
    expect(
      hasGscGoogleAccountChanged("owner@example.com", "other@example.com")
    ).toBe(true);
  });

  test("is false when either email is missing", () => {
    expect(hasGscGoogleAccountChanged("owner@example.com", null)).toBe(false);
    expect(hasGscGoogleAccountChanged(null, "owner@example.com")).toBe(false);
    expect(hasGscGoogleAccountChanged(undefined, "owner@example.com")).toBe(
      false
    );
    expect(hasGscGoogleAccountChanged(null, null)).toBe(false);
  });
});
