import type { TitleFilterRule } from "../types/tools";

function matchesRule(title: string, rule: TitleFilterRule): boolean {
  if (rule.matchType === "contains") {
    return title.toLowerCase().includes(rule.pattern.toLowerCase());
  }

  try {
    return new RegExp(rule.pattern, "i").test(title);
  } catch {
    return false;
  }
}

export function isTitleExcluded(
  title: string | null | undefined,
  rules: TitleFilterRule[]
): boolean {
  if (!title || rules.length === 0) {
    return false;
  }

  const normalizedTitle = title.trim();
  return rules.some((rule) => matchesRule(normalizedTitle, rule));
}

export function getCommitTitle(message: string): string {
  const newlineIndex = message.indexOf("\n");
  return newlineIndex === -1 ? message : message.slice(0, newlineIndex);
}
