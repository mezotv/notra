import type { SettingsNavGroup, SettingsNavItem } from "@/types/settings/modal";

const NON_ALNUM = /[^a-z0-9]+/g;
const WHITESPACE = /\s+/;

function compact(value: string): string {
  return value.toLowerCase().replace(NON_ALNUM, "");
}

function tokensOf(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(WHITESPACE)
    .map((token) => compact(token))
    .filter((token) => token.length > 0);
}

function itemHaystack(group: SettingsNavGroup, item: SettingsNavItem): string {
  return compact(
    [
      item.label,
      item.description,
      item.id,
      group.label,
      group.id,
      ...item.keywords,
    ].join(" ")
  );
}

function tokenScore(
  token: string,
  group: SettingsNavGroup,
  item: SettingsNavItem
): number {
  const label = compact(item.label);
  if (label === token) {
    return 100;
  }
  if (label.startsWith(token)) {
    return 80;
  }
  if (label.includes(token)) {
    return 55;
  }
  if (item.keywords.some((keyword) => compact(keyword) === token)) {
    return 45;
  }
  if (item.keywords.some((keyword) => compact(keyword).includes(token))) {
    return 35;
  }
  if (compact(item.description).includes(token)) {
    return 25;
  }
  if (
    compact(group.label).includes(token) ||
    compact(group.id).includes(token)
  ) {
    return 15;
  }
  return 10;
}

function itemMatchesQuery(
  group: SettingsNavGroup,
  item: SettingsNavItem,
  tokens: string[]
): boolean {
  if (tokens.length === 0) {
    return true;
  }
  const haystack = itemHaystack(group, item);
  return tokens.every((token) => haystack.includes(token));
}

function itemScore(
  group: SettingsNavGroup,
  item: SettingsNavItem,
  tokens: string[]
): number {
  if (tokens.length === 0) {
    return 0;
  }
  return tokens.reduce(
    (total, token) => total + tokenScore(token, group, item),
    0
  );
}

export function filterSettingsNavGroups(
  groups: readonly SettingsNavGroup[],
  query: string,
  hasAiCredits: boolean
): SettingsNavGroup[] {
  const tokens = tokensOf(query);
  const visible: SettingsNavGroup[] = [];

  for (const group of groups) {
    const scored = group.items
      .filter((item) => {
        if (item.requiresAiCredits && !hasAiCredits) {
          return false;
        }
        return itemMatchesQuery(group, item, tokens);
      })
      .map((item, index) => ({
        item,
        index,
        score: itemScore(group, item, tokens),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.index - right.index;
      });

    if (scored.length > 0) {
      visible.push({
        ...group,
        items: scored.map((entry) => entry.item),
      });
    }
  }

  if (tokens.length > 0) {
    visible.sort((left, right) => {
      const leftLead = left.items[0];
      const rightLead = right.items[0];
      const leftScore = leftLead ? itemScore(left, leftLead, tokens) : 0;
      const rightScore = rightLead ? itemScore(right, rightLead, tokens) : 0;
      return rightScore - leftScore;
    });
  }

  return visible;
}

export function firstSettingsSearchSection(
  groups: readonly SettingsNavGroup[]
): SettingsNavItem["id"] | null {
  return groups[0]?.items[0]?.id ?? null;
}

export function settingsSearchContainsSection(
  groups: readonly SettingsNavGroup[],
  section: SettingsNavItem["id"]
): boolean {
  return groups.some((group) =>
    group.items.some((item) => item.id === section)
  );
}
