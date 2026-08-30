import {
  GEO_PROMPT_HISTORY_CHANGE_LABELS,
  GEO_PROMPT_RECEIPT_LABELS,
  GEO_PROMPT_SCAN_ID_DISPLAY_LENGTH,
  GEO_SENTIMENT_LABELS,
} from "@notra/geo-core/constants/geo";
import type {
  GeoAnswerSource,
  GeoPromptHistoryCheck,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";

import type {
  PromptHistoryChange,
  PromptHistoryEntry,
  PromptReceiptTextInput,
} from "@/types/geo";
import { formatEngineFamily } from "@/utils/geo-charts";

const DEFAULT_LANGUAGE = "English";

export function promptHistoryForEngine(
  checks: readonly GeoPromptHistoryCheck[],
  engine: string
): GeoPromptHistoryCheck[] {
  return checks
    .filter((check) => check.engine === engine)
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

function positionLabel(position: number | null): string {
  return position === null
    ? GEO_PROMPT_RECEIPT_LABELS.notRanked
    : `#${position}`;
}

function changesBetween(
  current: GeoPromptHistoryCheck,
  previous: GeoPromptHistoryCheck
): PromptHistoryChange[] {
  const changes: PromptHistoryChange[] = [];
  if (current.mentioned && !previous.mentioned) {
    changes.push({
      kind: "gained",
      label: GEO_PROMPT_HISTORY_CHANGE_LABELS.gainedMention,
    });
  } else if (!current.mentioned && previous.mentioned) {
    changes.push({
      kind: "lost",
      label: GEO_PROMPT_HISTORY_CHANGE_LABELS.lostMention,
    });
  } else if (
    current.mentioned &&
    previous.mentioned &&
    current.position !== previous.position
  ) {
    changes.push({
      kind: "position",
      label: `${GEO_PROMPT_RECEIPT_LABELS.position} ${positionLabel(previous.position)} → ${positionLabel(current.position)}`,
    });
  }
  const known = new Set(previous.competitors);
  const added = current.competitors.filter((name) => !known.has(name));
  if (added.length > 0) {
    changes.push({
      kind: "competitor",
      label: `${GEO_PROMPT_HISTORY_CHANGE_LABELS.newCompetitor}: ${added.join(", ")}`,
    });
  }
  return changes;
}

export function promptHistoryChanges(
  checks: readonly GeoPromptHistoryCheck[]
): PromptHistoryEntry[] {
  const ordered = [...checks].sort((left, right) =>
    right.capturedAt.localeCompare(left.capturedAt)
  );
  return ordered.map((check, index) => {
    const previous = ordered[index + 1];
    return {
      check,
      changes: previous ? changesBetween(check, previous) : [],
    };
  });
}

export function truncateScanId(scanId: string): string {
  return scanId.slice(0, GEO_PROMPT_SCAN_ID_DISPLAY_LENGTH);
}

export function promptCheckLanguage(
  check: GeoPromptHistoryCheck | null
): string {
  const language = check?.language.trim() ?? "";
  return language.length > 0 ? language : DEFAULT_LANGUAGE;
}

export function promptSentimentLabel(sentiment: string | null): string {
  if (!sentiment) {
    return GEO_PROMPT_RECEIPT_LABELS.noSentiment;
  }
  return GEO_SENTIMENT_LABELS[sentiment] ?? sentiment;
}

export function promptOutcomeLabel(mentioned: boolean): string {
  return mentioned
    ? GEO_PROMPT_RECEIPT_LABELS.mentioned
    : GEO_PROMPT_RECEIPT_LABELS.notMentioned;
}

export function promptPositionLabel(position: number | null): string {
  return positionLabel(position);
}

function receiptSourceLine(source: GeoAnswerSource): string {
  return `- ${source.title} (${source.domain}) ${source.url}`;
}

export function buildPromptReceiptText({
  prompt,
  result,
  latest,
}: PromptReceiptTextInput): string {
  const competitors =
    result.competitors.length > 0
      ? result.competitors.join(", ")
      : GEO_PROMPT_RECEIPT_LABELS.noCompetitors;
  const searches =
    result.searchQueries.length > 0
      ? result.searchQueries.map((query) => `- ${query}`).join("\n")
      : GEO_PROMPT_RECEIPT_LABELS.noSearches;
  const sources =
    result.sources.length > 0
      ? result.sources.map(receiptSourceLine).join("\n")
      : GEO_PROMPT_RECEIPT_LABELS.noSources;
  const lines = [
    `Prompt: ${prompt}`,
    `Engine: ${formatEngineFamily(result.engine)}`,
    `${GEO_PROMPT_RECEIPT_LABELS.captured}: ${formatAiTrafficTimestamp(result.lastCheckedAt)}`,
    `${GEO_PROMPT_RECEIPT_LABELS.language}: ${promptCheckLanguage(latest)}`,
    `Outcome: ${promptOutcomeLabel(result.mentioned)}`,
    `${GEO_PROMPT_RECEIPT_LABELS.position}: ${positionLabel(result.position)}`,
    `${GEO_PROMPT_RECEIPT_LABELS.sentiment}: ${promptSentimentLabel(result.sentiment)}`,
    `${GEO_PROMPT_RECEIPT_LABELS.competitors}: ${competitors}`,
    "",
    `${GEO_PROMPT_RECEIPT_LABELS.searches}:`,
    searches,
    "",
    `${GEO_PROMPT_RECEIPT_LABELS.sources}:`,
    sources,
    "",
    `${GEO_PROMPT_RECEIPT_LABELS.scanId}: ${latest?.scanId ?? ""}`.trimEnd(),
  ];
  return lines.join("\n");
}
