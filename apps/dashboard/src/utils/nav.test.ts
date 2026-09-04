import { describe, expect, test } from "bun:test";

import { resolveSidebarMode } from "./nav";

describe("resolveSidebarMode", () => {
  test("preserves GEO mode on shared content routes", () => {
    expect(resolveSidebarMode("content", "geo")).toBe("geo");
    expect(resolveSidebarMode("content/post-id", "geo")).toBe("geo");
  });

  test("preserves GEO mode on schedule routes", () => {
    expect(resolveSidebarMode("automation/schedules", "geo")).toBe("geo");
    expect(resolveSidebarMode("automation/schedules/new", "geo")).toBe("geo");
  });

  test("keeps other automation routes in Studio", () => {
    expect(resolveSidebarMode("automation/events", "geo")).toBe("studio");
  });
});
