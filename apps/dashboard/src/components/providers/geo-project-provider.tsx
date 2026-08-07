"use client";

import { createContext, useContext, useMemo } from "react";
import type {
  GeoProjectContextValue,
  GeoProjectProviderProps,
} from "@/types/geo";

const GeoProjectContext = createContext<GeoProjectContextValue>({
  projectId: undefined,
});

export function GeoProjectProvider({
  projectId,
  children,
}: GeoProjectProviderProps) {
  const value = useMemo(() => ({ projectId }), [projectId]);
  return (
    <GeoProjectContext.Provider value={value}>
      {children}
    </GeoProjectContext.Provider>
  );
}

export function useGeoProjectScope(): GeoProjectContextValue {
  return useContext(GeoProjectContext);
}
