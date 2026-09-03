import {
  GEO_CHANGE_KIND_LABELS,
  GEO_CHANGES_CITATIONS_ADDED_PREFIX,
  GEO_CHANGES_CITATIONS_REMOVED_PREFIX,
  GEO_CHANGES_COMPETITORS_PREFIX,
  GEO_CHANGES_POSITION_PREFIX,
  GEO_CHANGES_SCANNING_SUBLINE,
  GEO_CHANGES_STATE_MENTIONED,
  GEO_CHANGES_STATE_NEW,
  GEO_CHANGES_STATE_NOT_MENTIONED,
  GEO_CHANGES_SUBLINE_PREFIX,
} from "@notra/geo-core/constants/geo";
import type {
  GeoChangeCheckState,
  GeoChangeEvent,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import {
  engineFamilyLabel,
  engineFamilyOf,
} from "@notra/geo-core/utils/geo-engine-family";

import type { GeoChangeDetail } from "@/types/geo";

export function geoChangeEngineLabel(engine: string): string {
  return engineFamilyLabel(engineFamilyOf(engine));
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
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

export function describeGeoChangeState(
  state: GeoChangeCheckState | null
): string {
  if (!state) {
    return GEO_CHANGES_STATE_NEW;
  }
  if (!state.mentioned) {
    return GEO_CHANGES_STATE_NOT_MENTIONED;
  }
  if (state.position === null) {
    return GEO_CHANGES_STATE_MENTIONED;
  }
  return `${GEO_CHANGES_POSITION_PREFIX}${state.position}`;
}

function describeChangeNote(event: GeoChangeEvent): string | null {
  if (event.competitors.length > 0) {
    return `${GEO_CHANGES_COMPETITORS_PREFIX}: ${joinNames(event.competitors)}`;
  }
  if (event.domains.length === 0) {
    return null;
  }
  const prefix =
    event.kind === "citation_removed"
      ? GEO_CHANGES_CITATIONS_REMOVED_PREFIX
      : GEO_CHANGES_CITATIONS_ADDED_PREFIX;
  return `${prefix}: ${event.domains.join(", ")}`;
}

export function describeGeoChangeDetail(
  event: GeoChangeEvent
): GeoChangeDetail {
  return {
    title: GEO_CHANGE_KIND_LABELS[event.kind],
    engine: geoChangeEngineLabel(event.engine),
    before: describeGeoChangeState(event.previous),
    after: describeGeoChangeState(event.current),
    note: describeChangeNote(event),
  };
}

export function geoChangePositionSortValue(event: GeoChangeEvent): number {
  return event.current.position ?? Number.MAX_SAFE_INTEGER;
}
