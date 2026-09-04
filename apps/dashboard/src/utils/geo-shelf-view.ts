import { GEO_SHELF_VIEWS } from "@/constants/geo-shelf";
import { localStorageKeys } from "@/constants/storage";

import type { GeoShelfView } from "../types/geo-shelf";

const listeners = new Set<() => void>();
let fallbackView: GeoShelfView = "table";

export function subscribeGeoShelfView(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGeoShelfView(): GeoShelfView {
  try {
    const storedView = window.localStorage.getItem(
      localStorageKeys.geoShelfView
    );
    return (
      GEO_SHELF_VIEWS.find((candidate) => candidate === storedView) ??
      fallbackView
    );
  } catch {
    return fallbackView;
  }
}

export function getServerGeoShelfView(): GeoShelfView {
  return "table";
}

export function setGeoShelfView(view: GeoShelfView): void {
  fallbackView = view;
  try {
    window.localStorage.setItem(localStorageKeys.geoShelfView, view);
  } catch {
    // The in-memory fallback still keeps the current page responsive.
  }
  for (const listener of listeners) {
    listener();
  }
}
