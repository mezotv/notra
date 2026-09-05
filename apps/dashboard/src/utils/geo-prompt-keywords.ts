import type { GeoSuggestionKeyword } from "@notra/geo-core/types/geo";

import type { PromptKeywordSegment } from "@/types/geo";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWordCharacter(value: string | undefined): boolean {
  return value !== undefined && /[\p{L}\p{N}]/u.test(value);
}

function hasQueryBoundaries(
  text: string,
  match: string,
  start: number,
  end: number
): boolean {
  return !(
    (isWordCharacter(match[0]) && isWordCharacter(text[start - 1])) ||
    (isWordCharacter(match.at(-1)) && isWordCharacter(text[end]))
  );
}

export function findPromptKeywordSegments(
  text: string,
  keywords: readonly GeoSuggestionKeyword[]
): PromptKeywordSegment[] {
  if (text.length === 0) {
    return [];
  }

  const keywordByQuery = new Map<string, GeoSuggestionKeyword>();
  for (const keyword of keywords) {
    const query = keyword.query.trim();
    if (query.length === 0) {
      continue;
    }
    const key = query.toLowerCase();
    const existing = keywordByQuery.get(key);
    if (!existing || keyword.impressions > existing.impressions) {
      keywordByQuery.set(key, { ...keyword, query });
    }
  }

  const candidates: [number, number, GeoSuggestionKeyword][] = [];
  for (const keyword of keywordByQuery.values()) {
    const matches = text.matchAll(
      new RegExp(escapeRegExp(keyword.query), "giu")
    );
    for (const match of matches) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;
      if (hasQueryBoundaries(text, value, start, end)) {
        candidates.push([start, end, keyword]);
      }
    }
  }

  candidates.sort(
    ([leftStart, leftEnd, left], [rightStart, rightEnd, right]) =>
      leftStart - rightStart ||
      rightEnd - rightStart - (leftEnd - leftStart) ||
      right.impressions - left.impressions
  );

  const segments: PromptKeywordSegment[] = [];
  let cursor = 0;
  for (const [start, end, keyword] of candidates) {
    if (start < cursor) {
      continue;
    }
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), keyword: null });
    }
    segments.push({ text: text.slice(start, end), keyword });
    cursor = end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), keyword: null });
  }

  return segments;
}
