const FUZZY_EXACT_SCORE = 1;
const FUZZY_PREFIX_SCORE = 0.9;
const FUZZY_CONTAINS_SCORE = 0.75;
const FUZZY_SUBSEQUENCE_BASE = 0.5;
const FUZZY_MIN_SCORE = 0.35;

function subsequenceScore(haystack: string, needle: string): number {
  let index = 0;
  let matched = 0;
  let gaps = 0;
  for (const char of needle) {
    const found = haystack.indexOf(char, index);
    if (found === -1) {
      return 0;
    }
    if (found > index) {
      gaps += 1;
    }
    index = found + 1;
    matched += 1;
  }
  if (matched < needle.length) {
    return 0;
  }
  const density = needle.length / Math.max(haystack.length, needle.length);
  const penalty = gaps / (needle.length + gaps);
  return FUZZY_SUBSEQUENCE_BASE * (1 - penalty) + density * 0.2;
}

export function fuzzyScore(value: string, query: string): number {
  const haystack = value.trim().toLowerCase();
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return FUZZY_EXACT_SCORE;
  }
  if (haystack === needle) {
    return FUZZY_EXACT_SCORE;
  }
  if (haystack.startsWith(needle)) {
    return FUZZY_PREFIX_SCORE;
  }
  if (haystack.includes(needle)) {
    return FUZZY_CONTAINS_SCORE;
  }
  return subsequenceScore(haystack, needle);
}

export function fuzzyMatches(
  values: readonly string[],
  query: string
): boolean {
  if (query.trim().length === 0) {
    return true;
  }
  return values.some((value) => fuzzyScore(value, query) >= FUZZY_MIN_SCORE);
}

export function bestFuzzyScore(
  values: readonly string[],
  query: string
): number {
  let best = 0;
  for (const value of values) {
    const score = fuzzyScore(value, query);
    if (score > best) {
      best = score;
    }
  }
  return best;
}
