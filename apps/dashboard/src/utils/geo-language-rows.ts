import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@notra/ai/constants/languages";
import { GEO_MAX_LANGUAGES } from "@/constants/geo";
import type {
  GeoLanguageSharePoint,
  LanguagePerformanceRow,
  LanguagePerformanceSuggestedRow,
  LanguagePerformanceTrackedRow,
} from "@/types/geo";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

const EMPTY_LANGUAGE_POINT = {
  checks: 0,
  mentions: 0,
  mentionRate: 0,
  avgPosition: null,
} as const;

export function extraGeoLanguages(languages: readonly string[]): string[] {
  const extras: string[] = [];
  const seen = new Set<string>();
  for (const language of languages) {
    if (language === DEFAULT_LANGUAGE || seen.has(language)) {
      continue;
    }
    seen.add(language);
    extras.push(language);
    if (extras.length >= GEO_MAX_LANGUAGES) {
      break;
    }
  }
  return extras;
}

function canAddGeoLanguage(
  configuredLanguages: readonly string[],
  language: string
): boolean {
  if (language === DEFAULT_LANGUAGE || !SUPPORTED_LANGUAGE_SET.has(language)) {
    return false;
  }
  const extras = extraGeoLanguages(configuredLanguages);
  return extras.length < GEO_MAX_LANGUAGES && !extras.includes(language);
}

export function withAddedGeoLanguage(
  configuredLanguages: readonly string[],
  language: string
): string[] | null {
  if (!canAddGeoLanguage(configuredLanguages, language)) {
    return null;
  }
  return [...extraGeoLanguages(configuredLanguages), language];
}

export function withRemovedGeoLanguage(
  configuredLanguages: readonly string[],
  language: string
): string[] | null {
  if (language === DEFAULT_LANGUAGE) {
    return null;
  }
  const extras = extraGeoLanguages(configuredLanguages);
  if (!extras.includes(language)) {
    return null;
  }
  return extras.filter((item) => item !== language);
}

function toTrackedRow(
  point: GeoLanguageSharePoint
): LanguagePerformanceTrackedRow {
  return { kind: "tracked", ...point };
}

function emptyTrackedRow(language: string): LanguagePerformanceTrackedRow {
  return { kind: "tracked", language, ...EMPTY_LANGUAGE_POINT };
}

function suggestedRow(language: string): LanguagePerformanceSuggestedRow {
  return { kind: "suggested", language };
}

export function buildLanguagePerformanceRows({
  points,
  configuredLanguages,
  slotCount,
}: {
  points: readonly GeoLanguageSharePoint[];
  configuredLanguages: readonly string[];
  slotCount: number;
}): LanguagePerformanceRow[] {
  const extras = extraGeoLanguages(configuredLanguages);
  const tracked: LanguagePerformanceTrackedRow[] = points.map(toTrackedRow);
  const seen = new Set(tracked.map((row) => row.language));

  for (const language of extras) {
    if (seen.has(language)) {
      continue;
    }
    seen.add(language);
    tracked.push(emptyTrackedRow(language));
  }

  seen.add(DEFAULT_LANGUAGE);

  const remainingSlots = Math.max(0, slotCount - tracked.length);
  if (remainingSlots === 0) {
    return tracked;
  }

  const suggested: LanguagePerformanceSuggestedRow[] = [];
  for (const language of SUPPORTED_LANGUAGES) {
    if (seen.has(language)) {
      continue;
    }
    suggested.push(suggestedRow(language));
    if (suggested.length >= remainingSlots) {
      break;
    }
  }

  return [...tracked, ...suggested];
}
