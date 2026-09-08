"use client";

import {
  calcGeoScanSize,
  geoScanSizeSeverity,
} from "@notra/geo-core/utils/geo-scan";

import { useAnswersBalance } from "@/lib/hooks/use-answers-balance";
import { useGeoModelCatalog } from "@/lib/hooks/use-geo";
import { useGeoSequencesDb } from "@/lib/hooks/use-geo-db";
import type { GeoScanEstimateInput } from "@/types/geo-scan-size";

export function useGeoScanEstimate({
  organizationId,
  promptCount,
  engines,
  languages,
}: GeoScanEstimateInput) {
  const { data: catalog } = useGeoModelCatalog(organizationId);
  const { sequences, isLoading: sequencesLoading } =
    useGeoSequencesDb(organizationId);
  const {
    balance,
    isLoading: balanceLoading,
    isUnlimited,
  } = useAnswersBalance();

  if (!catalog || sequencesLoading || promptCount === undefined) {
    return { scanSize: null, warningSeverity: null };
  }

  const scanSize = calcGeoScanSize({
    promptCount,
    engines,
    languages,
    catalog,
    sequences,
  });
  const severity = geoScanSizeSeverity(scanSize);
  // Unknown balances retain the large-scan warning until billing answers.
  const covered =
    isUnlimited || (!balanceLoading && balance !== null && balance >= scanSize);
  const warningSeverity = severity === "ok" || covered ? null : severity;

  return { scanSize, warningSeverity };
}
