import { describe, expect, test } from "bun:test";

import type { SkillListItem } from "@/types/skills/page";

import {
  filterSkills,
  formatSkillUpdatedAt,
  sortSkills,
  toggleSkillSort,
} from "./skills";

const skill = (overrides: Partial<SkillListItem>): SkillListItem => ({
  id: overrides.name ?? "id",
  name: "skill",
  description: "",
  isSystem: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const skills = [
  skill({
    name: "changelog",
    description: "Generate a changelog",
    isSystem: true,
    updatedAt: "2026-01-03T00:00:00.000Z",
  }),
  skill({
    name: "api-contract",
    description: "Draft OpenAPI specs",
    updatedAt: "2026-01-05T00:00:00.000Z",
  }),
  skill({
    name: "humanizer",
    description: "Remove signs of AI writing",
    isSystem: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }),
];

describe("filterSkills", () => {
  test("matches name and description case-insensitively", () => {
    expect(filterSkills(skills, "OPENAPI").map((s) => s.name)).toEqual([
      "api-contract",
    ]);
    expect(filterSkills(skills, "human").map((s) => s.name)).toEqual([
      "humanizer",
    ]);
  });

  test("returns everything for a blank query", () => {
    expect(filterSkills(skills, "   ")).toBe(skills);
  });
});

describe("sortSkills", () => {
  test("sorts by name in both directions", () => {
    expect(
      sortSkills(skills, { key: "name", direction: "asc" }).map((s) => s.name)
    ).toEqual(["api-contract", "changelog", "humanizer"]);
    expect(
      sortSkills(skills, { key: "name", direction: "desc" }).map((s) => s.name)
    ).toEqual(["humanizer", "changelog", "api-contract"]);
  });

  test("sorts by updatedAt with newest first on desc", () => {
    expect(
      sortSkills(skills, { key: "updatedAt", direction: "desc" }).map(
        (s) => s.name
      )
    ).toEqual(["api-contract", "changelog", "humanizer"]);
  });

  test("groups system skills first on type asc and breaks ties by name", () => {
    expect(
      sortSkills(skills, { key: "type", direction: "asc" }).map((s) => s.name)
    ).toEqual(["changelog", "humanizer", "api-contract"]);
  });
});

describe("toggleSkillSort", () => {
  test("switching columns resets direction, updatedAt defaults to desc", () => {
    expect(toggleSkillSort({ key: "name", direction: "desc" }, "type")).toEqual(
      { key: "type", direction: "asc" }
    );
    expect(
      toggleSkillSort({ key: "name", direction: "asc" }, "updatedAt")
    ).toEqual({ key: "updatedAt", direction: "desc" });
  });

  test("same column flips direction", () => {
    expect(toggleSkillSort({ key: "name", direction: "asc" }, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
  });
});

describe("formatSkillUpdatedAt", () => {
  const now = Date.parse("2026-09-03T12:00:00.000Z");

  test("picks the largest fitting unit", () => {
    expect(formatSkillUpdatedAt("2026-09-03T11:59:30.000Z", now)).toBe(
      "Just now"
    );
    expect(formatSkillUpdatedAt("2026-09-03T06:00:00.000Z", now)).toBe(
      "6 hours ago"
    );
    expect(formatSkillUpdatedAt("2026-08-20T12:00:00.000Z", now)).toBe(
      "2 weeks ago"
    );
    expect(formatSkillUpdatedAt("2025-06-01T12:00:00.000Z", now)).toBe(
      "last year"
    );
  });
});
