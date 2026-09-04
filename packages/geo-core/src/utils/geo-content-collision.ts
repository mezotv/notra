import {
  GEO_COLLISION_MERGE_TARGET_LIMIT,
  GEO_COLLISION_MIN_TOKEN_LENGTH,
  GEO_COLLISION_ORDERED_TITLE_BONUS,
  GEO_COLLISION_PARTIAL_SCORE,
  GEO_COLLISION_STOPWORDS,
  GEO_COLLISION_STRONG_SCORE,
  GEO_SEARCH_GAP_MIN_IMPRESSIONS,
} from "../constants/geo";
import type {
  GeoContentCollisionCandidate,
  GeoContentCollisionGap,
  GeoContentCollisionMatch,
  GeoSearchGapRecommendation,
  GeoSearchGapRecommendationInput,
} from "../types/geo";

const NON_WORD_RE = /[^\p{L}\p{N}\s]+/gu;
const WHITESPACE_RE = /\s+/;
const SLUG_SEPARATOR_RE = /[-_]+/g;
const ING_SUFFIX_RE = /ing$/;
const ES_SUFFIX_RE = /es$/;
const S_SUFFIX_RE = /s$/;
const STEM_MIN_LENGTH = 4;
const PERCENT = 100;

function stem(token: string): string {
  if (token.length <= STEM_MIN_LENGTH) {
    return token;
  }
  if (ING_SUFFIX_RE.test(token)) {
    return token.replace(ING_SUFFIX_RE, "");
  }
  if (ES_SUFFIX_RE.test(token)) {
    return token.replace(ES_SUFFIX_RE, "");
  }
  return token.replace(S_SUFFIX_RE, "");
}

export function collisionTokens(text: string): string[] {
  const tokens: string[] = [];
  const words = text
    .toLowerCase()
    .replace(NON_WORD_RE, " ")
    .split(WHITESPACE_RE);
  for (const word of words) {
    if (
      word.length < GEO_COLLISION_MIN_TOKEN_LENGTH ||
      GEO_COLLISION_STOPWORDS.has(word)
    ) {
      continue;
    }
    tokens.push(stem(word));
  }
  return tokens;
}

function termSet(parts: readonly string[]): Set<string> {
  const terms = new Set<string>();
  for (const part of parts) {
    for (const token of collisionTokens(part)) {
      terms.add(token);
    }
  }
  return terms;
}

function lastPathSegmentWords(url: string | null): string {
  if (!url) {
    return "";
  }
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  const last = segments.at(-1) ?? "";
  return last.replace(SLUG_SEPARATOR_RE, " ");
}

function slugWords(slug: string | null): string {
  return slug ? slug.replace(SLUG_SEPARATOR_RE, " ") : "";
}

function candidateTerms(candidate: GeoContentCollisionCandidate): Set<string> {
  const extra =
    candidate.kind === "page"
      ? lastPathSegmentWords(candidate.url)
      : slugWords(candidate.slug);
  return termSet([candidate.title ?? "", extra]);
}

function containsInOrder(
  tokens: readonly string[],
  first: string,
  second: string
): boolean {
  const firstIndex = tokens.indexOf(first);
  if (firstIndex < 0) {
    return false;
  }
  return tokens.includes(second, firstIndex + 1);
}

function candidateTitle(candidate: GeoContentCollisionCandidate): string {
  const title = candidate.title?.trim();
  if (title) {
    return title;
  }
  return candidate.url ?? candidate.slug ?? candidate.id;
}

export function scoreContentCollisions(
  gap: GeoContentCollisionGap,
  candidates: readonly GeoContentCollisionCandidate[]
): GeoContentCollisionMatch[] {
  const gapTerms = termSet([gap.prompt, gap.title ?? "", ...gap.queries]);
  if (gapTerms.size === 0) {
    return [];
  }
  const [firstQueryToken, secondQueryToken] = collisionTokens(
    gap.queries[0] ?? ""
  );
  const orderedPair: [string, string] | null =
    firstQueryToken && secondQueryToken
      ? [firstQueryToken, secondQueryToken]
      : null;

  const matches: GeoContentCollisionMatch[] = [];
  for (const candidate of candidates) {
    const terms = candidateTerms(candidate);
    if (terms.size === 0) {
      continue;
    }
    let shared = 0;
    for (const term of gapTerms) {
      if (terms.has(term)) {
        shared += 1;
      }
    }
    if (shared === 0) {
      continue;
    }
    let score = shared / gapTerms.size;
    if (
      orderedPair &&
      containsInOrder(
        collisionTokens(candidate.title ?? ""),
        orderedPair[0],
        orderedPair[1]
      )
    ) {
      score += GEO_COLLISION_ORDERED_TITLE_BONUS;
    }
    matches.push({
      kind: candidate.kind,
      id: candidate.id,
      url: candidate.url,
      title: candidateTitle(candidate),
      score: Math.min(1, score),
    });
  }
  matches.sort(
    (left, right) =>
      right.score - left.score || left.title.localeCompare(right.title)
  );
  return matches;
}

function percent(score: number): number {
  return Math.round(score * PERCENT);
}

export function recommendSearchGapAction({
  matches,
  impressions,
  clicks,
}: GeoSearchGapRecommendationInput): GeoSearchGapRecommendation {
  const best = matches[0];
  if (best && best.score >= GEO_COLLISION_STRONG_SCORE) {
    return {
      action: "update",
      reason: `Existing page covers ${percent(best.score)}% of this query cluster; update it instead of publishing a duplicate.`,
      targets: [best],
    };
  }
  const partial = matches.filter(
    (match) => match.score >= GEO_COLLISION_PARTIAL_SCORE
  );
  if (partial.length >= 2) {
    const targets = partial.slice(0, GEO_COLLISION_MERGE_TARGET_LIMIT);
    return {
      action: "merge",
      reason: `${targets.length} existing pages each cover part of this query cluster; merge them into one page instead of adding a third angle.`,
      targets,
    };
  }
  const impressionCount = impressions ?? 0;
  const clickCount = clicks ?? 0;
  if (
    impressions !== null &&
    impressionCount < GEO_SEARCH_GAP_MIN_IMPRESSIONS &&
    clickCount === 0
  ) {
    return {
      action: "ignore",
      reason: `Only ${impressionCount} impressions and no clicks so far; the demand is too thin to justify a new page yet.`,
      targets: [],
    };
  }
  if (best) {
    return {
      action: "create",
      reason: `The closest existing page covers only ${percent(best.score)}% of this query cluster; a dedicated page can own it.`,
      targets: [best],
    };
  }
  return {
    action: "create",
    reason:
      "No existing page or post covers this query cluster; a new page can own it.",
    targets: [],
  };
}
