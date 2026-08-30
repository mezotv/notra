import {
  GEO_PROMPT_MAX_TAGS,
  GEO_PROMPT_TAG_MAX_LENGTH,
} from "../constants/geo";

const WHITESPACE_RUN_REGEX = /\s+/g;

export function normalizePromptTag(value: string): string {
  return value
    .trim()
    .replace(WHITESPACE_RUN_REGEX, " ")
    .toLowerCase()
    .slice(0, GEO_PROMPT_TAG_MAX_LENGTH);
}

export function normalizePromptTags(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of values) {
    const tag = normalizePromptTag(value);
    if (tag.length === 0 || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= GEO_PROMPT_MAX_TAGS) {
      break;
    }
  }
  return tags;
}

export function mergePromptTags(
  current: readonly string[],
  additions: readonly string[]
): string[] {
  return normalizePromptTags([...current, ...additions]);
}

export function collectPromptTags(
  prompts: readonly { tags: readonly string[] }[]
): string[] {
  const counts = new Map<string, number>();
  for (const prompt of prompts) {
    for (const tag of prompt.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
    )
    .map(([tag]) => tag);
}
