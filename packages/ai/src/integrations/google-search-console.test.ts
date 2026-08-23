import { describe, expect, test } from "bun:test";
import {
  hasGscGoogleAccountChanged,
  shouldClearGscSiteOnReconnect,
} from "./google-search-console";

describe("hasGscGoogleAccountChanged", () => {
  test("is false when the same Google account reconnects", () => {
    expect(
      hasGscGoogleAccountChanged("owner@example.com", "owner@example.com")
    ).toBe(false);
  });

  test("treats case and surrounding whitespace as the same account", () => {
    expect(
      hasGscGoogleAccountChanged("  Owner@Example.com ", "owner@example.com")
    ).toBe(false);
  });

  test("is true when a different Google account reconnects", () => {
    expect(
      hasGscGoogleAccountChanged("owner@example.com", "other@example.com")
    ).toBe(true);
  });

  test("treats a missing or blank next email as a changed account", () => {
    expect(hasGscGoogleAccountChanged("owner@example.com", null)).toBe(true);
    expect(hasGscGoogleAccountChanged("owner@example.com", "   ")).toBe(true);
    expect(hasGscGoogleAccountChanged(null, null)).toBe(true);
  });

  test("does not treat a first connect as a changed account", () => {
    expect(hasGscGoogleAccountChanged(null, "owner@example.com")).toBe(false);
    expect(hasGscGoogleAccountChanged(undefined, "owner@example.com")).toBe(
      false
    );
  });
});

describe("shouldClearGscSiteOnReconnect", () => {
  test("is false on first connect", () => {
    expect(shouldClearGscSiteOnReconnect(null, "owner@example.com")).toBe(
      false
    );
    expect(shouldClearGscSiteOnReconnect(null, null)).toBe(false);
  });

  test("is false when the same Google account reconnects", () => {
    expect(
      shouldClearGscSiteOnReconnect(
        { googleAccountEmail: "owner@example.com", siteUrl: "https://a.com/" },
        "owner@example.com"
      )
    ).toBe(false);
  });

  test("is true when a different Google account reconnects", () => {
    expect(
      shouldClearGscSiteOnReconnect(
        { googleAccountEmail: "owner@example.com", siteUrl: "https://a.com/" },
        "other@example.com"
      )
    ).toBe(true);
  });

  test("is true when a property is selected but the previous email was never stored", () => {
    expect(
      shouldClearGscSiteOnReconnect(
        { googleAccountEmail: null, siteUrl: "https://a.com/" },
        "other@example.com"
      )
    ).toBe(true);
  });

  test("is false when no property is selected and the previous email is missing", () => {
    expect(
      shouldClearGscSiteOnReconnect(
        { googleAccountEmail: null, siteUrl: null },
        "owner@example.com"
      )
    ).toBe(false);
  });
});
