import { GEO_LANGUAGE_CODES, GEO_LANGUAGE_LABELS } from "@/constants/geo";
import type {
  GeoLanguageCode,
  GeoLanguagePerformance,
  GeoPromptResult,
} from "@/types/geo";

export function geoLanguageLabel(language: string): string {
  return GEO_LANGUAGE_LABELS[language] ?? language;
}

export function isGeoLanguageCode(value: string): value is GeoLanguageCode {
  return GEO_LANGUAGE_CODES.some((code) => code === value);
}

export function toGeoLanguageCodes(values: string[]): GeoLanguageCode[] {
  return values.filter(isGeoLanguageCode);
}

export function summarizeLanguagePerformance(
  results: GeoPromptResult[]
): GeoLanguagePerformance[] {
  const byLanguage = new Map<string, { checks: number; mentions: number }>();
  for (const result of results) {
    const entry = byLanguage.get(result.language) ?? {
      checks: 0,
      mentions: 0,
    };
    entry.checks += 1;
    if (result.mentioned) {
      entry.mentions += 1;
    }
    byLanguage.set(result.language, entry);
  }
  return [...byLanguage.entries()]
    .map(([language, entry]) => ({
      language,
      checks: entry.checks,
      mentions: entry.mentions,
      mentionRate: entry.checks > 0 ? entry.mentions / entry.checks : 0,
    }))
    .sort((left, right) => right.checks - left.checks);
}
