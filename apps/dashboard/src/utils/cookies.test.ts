import { describe, expect, test } from "bun:test";

import { parseLastVisitedProject, updateLastVisitedProjects } from "./cookies";

describe("last visited project cookie", () => {
  test("continues to read the legacy single-organization format", () => {
    expect(parseLastVisitedProject("acme:project-1", "acme")).toBe("project-1");
  });

  test("preserves a project selection for each organization", () => {
    const withAcme = updateLastVisitedProjects(undefined, "acme", "project-a");
    const withBoth = updateLastVisitedProjects(withAcme, "beta", "project-b");

    expect(parseLastVisitedProject(withBoth, "acme")).toBe("project-a");
    expect(parseLastVisitedProject(withBoth, "beta")).toBe("project-b");
  });

  test("updates one organization without changing another", () => {
    const withAcme = updateLastVisitedProjects(undefined, "acme", "project-a");
    const withBoth = updateLastVisitedProjects(withAcme, "beta", "project-b");
    const updated = updateLastVisitedProjects(withBoth, "acme", "project-a2");

    expect(parseLastVisitedProject(updated, "acme")).toBe("project-a2");
    expect(parseLastVisitedProject(updated, "beta")).toBe("project-b");
  });
});
