import {
  GEO_CHANGES_SCANNING_SUBLINE,
  GEO_CHANGES_SHOW_ALL_PREFIX,
  GEO_CHANGES_SUBLINE_PREFIX,
  GEO_CHANGES_SUMMARY_LABELS,
} from "@notra/geo-core/constants/geo";
import type {
  GeoChangeEvent,
  GeoChangesSummary,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import {
  engineFamilyLabel,
  engineFamilyOf,
} from "@notra/geo-core/utils/geo-engine-family";

function engineLabelOf(engine: string): string {
  return engineFamilyLabel(engineFamilyOf(engine));
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function positionMove(event: GeoChangeEvent, engine: string): string {
  const from = event.previous?.position ?? "-";
  const to = event.current.position ?? "-";
  return `Position ${from} → ${to} on ${engine}`;
}

export function describeGeoChange(event: GeoChangeEvent): string {
  const engine = engineLabelOf(event.engine);
  switch (event.kind) {
    case "gained_mention":
      return event.current.position === null
        ? `Now mentioned on ${engine}`
        : `Now mentioned on ${engine} at position ${event.current.position}`;
    case "lost_mention":
      return `Lost mention on ${engine}`;
    case "competitor_displaced": {
      const names = joinNames(event.competitors);
      if (event.current.mentioned) {
        return `${positionMove(event, engine)}; ${names} now appears`;
      }
      const verb = event.competitors.length > 1 ? "are" : "is";
      return `Lost mention on ${engine}; ${names} ${verb} now recommended`;
    }
    case "position_improved":
    case "position_dropped":
      return positionMove(event, engine);
    case "citation_added":
      return event.domains.length > 1
        ? `New citations: ${event.domains.join(", ")}`
        : `New citation: ${event.domains[0] ?? ""}`;
    case "citation_removed":
      return event.domains.length > 1
        ? `Citations dropped: ${event.domains.join(", ")}`
        : `Citation dropped: ${event.domains[0] ?? ""}`;
    case "new_engine":
      return event.current.mentioned
        ? `First scan on ${engine}, mentioned`
        : `First scan on ${engine}, not mentioned`;
    default:
      return "";
  }
}

export function geoChangesSubline(
  finishedAt: string | null | undefined,
  isScanning: boolean
): string {
  if (isScanning) {
    return GEO_CHANGES_SCANNING_SUBLINE;
  }
  if (!finishedAt) {
    return GEO_CHANGES_SUBLINE_PREFIX;
  }
  return `${GEO_CHANGES_SUBLINE_PREFIX} · ${formatAiTrafficTimestamp(finishedAt)}`;
}

export function geoChangesSummaryChips(
  summary: GeoChangesSummary
): { key: keyof GeoChangesSummary; label: string; value: number }[] {
  const keys: (keyof GeoChangesSummary)[] = [
    "gained",
    "lost",
    "positionImproved",
    "positionDropped",
    "citationsAdded",
    "citationsRemoved",
  ];
  return keys.map((key) => ({
    key,
    label: GEO_CHANGES_SUMMARY_LABELS[key],
    value: summary[key],
  }));
}

export function geoChangesShowAllLabel(count: number): string {
  return `${GEO_CHANGES_SHOW_ALL_PREFIX} ${count.toLocaleString()}`;
}
