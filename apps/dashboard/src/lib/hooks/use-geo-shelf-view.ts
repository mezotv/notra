"use client";

import { useSyncExternalStore } from "react";

import { GEO_SHELF_DEFAULT_VIEW } from "@/constants/geo-shelf";
import { localStorageKeys } from "@/constants/storage";
import type { GeoShelfView } from "@/types/geo-shelf";
import { isShelfView } from "@/utils/geo-shelf";

const SHELF_VIEW_EVENT = "notra:geo-shelf-view-change";

function readStoredView(): GeoShelfView {
  try {
    const value = window.localStorage.getItem(localStorageKeys.geoShelfView);
    return isShelfView(value) ? value : GEO_SHELF_DEFAULT_VIEW;
  } catch {
    return GEO_SHELF_DEFAULT_VIEW;
  }
}

function getServerSnapshot(): GeoShelfView {
  return GEO_SHELF_DEFAULT_VIEW;
}

function setStoredView(next: GeoShelfView): void {
  try {
    window.localStorage.setItem(localStorageKeys.geoShelfView, next);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(SHELF_VIEW_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(SHELF_VIEW_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SHELF_VIEW_EVENT, onChange);
  };
}

export function useGeoShelfView(): [
  GeoShelfView,
  (view: GeoShelfView) => void,
] {
  const view = useSyncExternalStore(
    subscribe,
    readStoredView,
    getServerSnapshot
  );

  return [view, setStoredView];
}
