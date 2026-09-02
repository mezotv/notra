import { describe, expect, test } from "bun:test";

import { buildPostAuthRedirectPath, sanitizeReturnTo } from "./return-to";

describe("sanitizeReturnTo", () => {
  test("accepts only local paths", () => {
    expect(sanitizeReturnTo("/workspace/settings")).toBe("/workspace/settings");
    expect(sanitizeReturnTo("https://example.com")).toBeNull();
    expect(sanitizeReturnTo("//example.com")).toBeNull();
    expect(sanitizeReturnTo("/\\example.com")).toBeNull();
  });
});

describe("buildPostAuthRedirectPath", () => {
  test("does not nest an existing auth callback", () => {
    expect(buildPostAuthRedirectPath("/callback")).toBe("/callback");
    expect(buildPostAuthRedirectPath("/callback?signup_method=github")).toBe(
      "/callback?signup_method=github"
    );
  });

  test("routes another local destination through the auth callback", () => {
    expect(buildPostAuthRedirectPath("/workspace/settings?tab=team")).toBe(
      "/callback?returnTo=%2Fworkspace%2Fsettings%3Ftab%3Dteam"
    );
  });

  test("falls back to the auth callback for unsafe destinations", () => {
    expect(buildPostAuthRedirectPath("https://example.com")).toBe("/callback");
  });
});
