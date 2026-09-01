"use client";

import { parseAsString, useQueryState } from "nuqs";

export const geoProjectQueryParser = parseAsString.withOptions({
  history: "replace",
});

export function useGeoProjectQueryState() {
  return useQueryState("project", geoProjectQueryParser);
}
