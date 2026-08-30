"use client";

import { useCallback, useSyncExternalStore } from "react";

import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { GEO_PROMPT_SAVED_VIEWS_MAX } from "@/constants/geo-prompts";
import { localStorageKeys } from "@/constants/storage";
import type {
  GeoPromptTableFilters,
  UseGeoSavedViewsResult,
} from "@/types/geo";
import {
  getGeoPromptViewsServerSnapshot,
  readGeoPromptViews,
  subscribeGeoPromptViews,
  writeGeoPromptViews,
} from "@/utils/geo-prompt-views";

export function useGeoSavedViews(
  organizationId: string
): UseGeoSavedViewsResult {
  const { projectId } = useGeoProjectScope();
  const key = localStorageKeys.geoPromptViews(organizationId, projectId);

  const views = useSyncExternalStore(
    subscribeGeoPromptViews,
    () => readGeoPromptViews(key),
    getGeoPromptViewsServerSnapshot
  );

  const saveView = useCallback(
    (name: string, query: GeoPromptTableFilters) => {
      const current = readGeoPromptViews(key);
      const next = [...current, { id: crypto.randomUUID(), name, query }];
      writeGeoPromptViews(key, next.slice(-GEO_PROMPT_SAVED_VIEWS_MAX));
    },
    [key]
  );

  const removeView = useCallback(
    (viewId: string) => {
      const current = readGeoPromptViews(key);
      writeGeoPromptViews(
        key,
        current.filter((view) => view.id !== viewId)
      );
    },
    [key]
  );

  return { views, saveView, removeView };
}
