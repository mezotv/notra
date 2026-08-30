import type { GeoCompetitorKind } from "@notra/geo-core/types/geo";

import type { ChartColorPair } from "./charts";

export interface GeoCompetitorRowEntry {
  id: string;
  name: string;
  domain: string | null;
  synonyms: string[];
  kind: GeoCompetitorKind;
  isOwnBrand: boolean;
  color: ChartColorPair;
}
