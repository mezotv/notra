import { GEO_SHELF_VIEWS } from "@/constants/geo-shelf";
import { localStorageKeys } from "@/constants/storage";

import type { GeoShelfView } from "../types/geo-shelf";

const listeners = new Set<() => void>();
let fallbackView: GeoShelfView = "table";
let unpersistedView: GeoShelfView | null = null;

export function subscribeGeoShelfView(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === localStorageKeys.geoShelfView) {
      listener();
    }
  };
  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getGeoShelfView(): GeoShelfView {
  if (unpersistedView !== null) {
    return unpersistedView;
  }
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
    unpersistedView = null;
  } catch {
    unpersistedView = view;
  }
  for (const listener of listeners) {
    listener();
  }
}
