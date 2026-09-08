import { describe, expect, test } from "bun:test";

import { SETTINGS_NAV_GROUPS } from "@/constants/settings";

import {
  filterSettingsNavGroups,
  firstSettingsSearchSection,
  settingsSearchContainsSection,
} from "./settings-search";

function sectionIds(query: string, hasAiCredits = true) {
  return filterSettingsNavGroups(SETTINGS_NAV_GROUPS, query, hasAiCredits)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe("filterSettingsNavGroups", () => {
  test("returns every section when the query is empty", () => {
    expect(sectionIds("")).toContain("account");
    expect(sectionIds("")).toContain("geo-models");
  });

  test("hides credits without the AI credits feature", () => {
    expect(sectionIds("", false)).not.toContain("credits");
    expect(sectionIds("credits", false)).not.toContain("credits");
  });

  test("matches keywords, not just labels", () => {
    expect(sectionIds("zdr")).toEqual(["geo-models"]);
    expect(sectionIds("invoice")).toContain("billing");
    expect(sectionIds("recap")).toContain("notifications");
  });

  test("requires every token to match", () => {
    expect(sectionIds("brand alias")).toEqual(["geo-brand"]);
    expect(sectionIds("brand xyzzy")).toEqual([]);
  });

  test("treats hyphens and spaces as the same", () => {
    expect(sectionIds("top-up")).toContain("credits");
    expect(sectionIds("topup")).toContain("credits");
  });

  test("matches a group name against every item in that group", () => {
    const ids = sectionIds("organization");
    expect(ids).toContain("general");
    expect(ids).toContain("members");
    expect(ids).toContain("billing");
  });

  test("ranks a label prefix above a keyword hit", () => {
    expect(sectionIds("mod")[0]).toBe("geo-models");
  });
});

describe("settings search helpers", () => {
  test("firstSettingsSearchSection reads the top hit", () => {
    const groups = filterSettingsNavGroups(SETTINGS_NAV_GROUPS, "zdr", true);
    expect(firstSettingsSearchSection(groups)).toBe("geo-models");
    expect(settingsSearchContainsSection(groups, "geo-models")).toBe(true);
    expect(settingsSearchContainsSection(groups, "account")).toBe(false);
  });
});
