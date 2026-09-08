import type { GeoCompetitor } from "../types/geo";

const PROTOCOL_REGEX = /^[a-z][a-z0-9+.-]*:\/\//i;
const LEADING_WWW_REGEX = /^www\./;
const PATH_SEPARATOR_REGEX = /[/?#]/;

export function normalizeCompetitorDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }

  const withoutProtocol = trimmed.replace(PROTOCOL_REGEX, "");
  const hostname = withoutProtocol.split(PATH_SEPARATOR_REGEX)[0] ?? "";
  const withoutPort = hostname.split(":")[0] ?? "";
  const bare = withoutPort.replace(LEADING_WWW_REGEX, "");

  return bare.length === 0 ? null : bare;
}

export function competitorKey(name: string): string {
  return name.trim().toLowerCase();
}

function competitorMatchKeys(competitor: GeoCompetitor): string[] {
  return [competitor.name, ...competitor.synonyms]
    .map(competitorKey)
    .filter((key) => key.length > 0);
}

function isNameBoundary(character: string): boolean {
  return character === " " || character === "-" || character === "/";
}

/** Index of `needle` in `value` when it sits on name boundaries, or -1. */
function wholeNameIndex(value: string, needle: string): number {
  if (needle.length === 0 || needle.length > value.length) {
    return -1;
  }
  let from = 0;
  while (from <= value.length - needle.length) {
    const index = value.indexOf(needle, from);
    if (index === -1) {
      return -1;
    }
    const beforeOk = index === 0 || isNameBoundary(value.charAt(index - 1));
    const afterIndex = index + needle.length;
    const afterOk =
      afterIndex === value.length || isNameBoundary(value.charAt(afterIndex));
    if (beforeOk && afterOk) {
      return index;
    }
    from = index + 1;
  }
  return -1;
}

export function findCompetitor(
  competitors: readonly GeoCompetitor[] | undefined,
  name: string
): GeoCompetitor | null {
  if (!competitors) {
    return null;
  }
  const key = competitorKey(name);
  if (key.length === 0) {
    return null;
  }

  const exact = competitors.find((competitor) =>
    competitorMatchKeys(competitor).includes(key)
  );
  if (exact) {
    return exact;
  }

  let best: GeoCompetitor | null = null;
  let bestLength = 0;
  let bestIndex = Number.NEGATIVE_INFINITY;
  for (const competitor of competitors) {
    for (const tracked of competitorMatchKeys(competitor)) {
      const mentionIndex = wholeNameIndex(key, tracked);
      const trackedIndex =
        mentionIndex === -1 ? wholeNameIndex(tracked, key) : -1;
      if (mentionIndex === -1 && trackedIndex === -1) {
        continue;
      }
      const matchLength = mentionIndex === -1 ? key.length : tracked.length;
      const matchIndex = mentionIndex === -1 ? trackedIndex : mentionIndex;
      if (
        matchLength < bestLength ||
        (matchLength === bestLength && matchIndex <= bestIndex)
      ) {
        continue;
      }
      best = competitor;
      bestLength = matchLength;
      bestIndex = matchIndex;
    }
  }
  return best;
}

export function findCompetitorDomain(
  competitors: readonly GeoCompetitor[] | undefined,
  name: string
): string | null {
  return findCompetitor(competitors, name)?.domain ?? null;
}
