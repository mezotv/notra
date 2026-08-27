"use client";

import type { Transaction } from "@tanstack/react-db";
import { useDbClient, useLiveQuery } from "@tanstack/react-db";
import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import {
  geoCollectionId,
  geoCompetitorsCollection,
  geoPromptsCollection,
  geoSequencesCollection,
} from "@/lib/db/geo-collections";
import {
  clearRowPending,
  getPendingRows,
  markRowPending,
  subscribeToPendingRows,
} from "@/lib/db/pending-rows";
import type {
  GeoCompetitor,
  GeoPromptSequence,
  GeoScopeInput,
  GeoTrackedPrompt,
} from "@/types/geo";
import { toErrorMessage } from "@/utils/error-message";

function usePendingRows(name: string, scope: GeoScopeInput) {
  const collectionId = geoCollectionId(name, scope);

  const pendingIds = useSyncExternalStore(
    subscribeToPendingRows,
    () => getPendingRows(collectionId),
    () => getPendingRows(collectionId)
  );

  const track = useCallback(
    (rowId: string, transaction: Transaction, fallback: string) => {
      markRowPending(collectionId, rowId);
      transaction.isPersisted.promise
        .catch((error: unknown) => {
          toast.error(toErrorMessage(error, fallback));
        })
        .finally(() => {
          clearRowPending(collectionId, rowId);
        });
    },
    [collectionId]
  );

  return { pendingIds, track };
}

export function useGeoPromptsDb(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const dbClient = useDbClient();
  const definition = geoPromptsCollection({ organizationId, projectId });
  const collection = dbClient.collection(definition);
  const { pendingIds, track } = usePendingRows("prompts", {
    organizationId,
    projectId,
  });

  const { data } = useLiveQuery({
    query: (q) => q.from({ prompt: definition }),
  });

  const prompts: GeoTrackedPrompt[] = data ?? [];

  const togglePrompt = (promptId: string, enabled: boolean) => {
    track(
      promptId,
      collection.update(promptId, (draft) => {
        draft.enabled = enabled;
      }),
      "Failed to update prompt"
    );
  };

  const removePrompts = (promptIds: string[]) => {
    for (const promptId of promptIds) {
      track(promptId, collection.delete(promptId), "Failed to remove prompt");
    }
  };

  const addPrompt = (prompt: string) => {
    const id = crypto.randomUUID();
    track(
      id,
      collection.insert({
        id,
        prompt,
        enabled: true,
        source: "custom",
        createdAt: new Date().toISOString(),
      }),
      "Failed to add prompt"
    );
  };

  return {
    prompts,
    pendingPromptIds: pendingIds,
    togglePrompt,
    removePrompts,
    addPrompt,
  };
}

export function useGeoCompetitorsDb(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const dbClient = useDbClient();
  const definition = geoCompetitorsCollection({ organizationId, projectId });
  const collection = dbClient.collection(definition);
  const { pendingIds, track } = usePendingRows("competitors", {
    organizationId,
    projectId,
  });

  const { data } = useLiveQuery({
    query: (q) => q.from({ competitor: definition }),
  });

  const competitors: GeoCompetitor[] = data ?? [];

  const saveCompetitor = (competitor: GeoCompetitor) => {
    const existing = collection.get(competitor.id);
    const transaction = existing
      ? collection.update(competitor.id, (draft) => {
          Object.assign(draft, competitor);
        })
      : collection.insert(competitor);
    track(competitor.id, transaction, "Failed to save competitor");
  };

  const removeCompetitor = (competitorId: string) => {
    track(
      competitorId,
      collection.delete(competitorId),
      "Failed to remove competitor"
    );
  };

  return {
    competitors,
    pendingCompetitorIds: pendingIds,
    saveCompetitor,
    removeCompetitor,
  };
}

export function useGeoSequencesDb(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const dbClient = useDbClient();
  const definition = geoSequencesCollection({ organizationId, projectId });
  const collection = dbClient.collection(definition);
  const { pendingIds, track } = usePendingRows("sequences", {
    organizationId,
    projectId,
  });

  const { data } = useLiveQuery({
    query: (q) => q.from({ sequence: definition }),
  });

  const sequences: GeoPromptSequence[] = data ?? [];

  const addSequence = (name: string, steps: string[]) => {
    const id = crypto.randomUUID();
    track(
      id,
      collection.insert({
        id,
        name,
        steps,
        enabled: true,
        createdAt: new Date().toISOString(),
      }),
      "Failed to add conversation"
    );
  };

  const updateSequence = (
    sequenceId: string,
    changes: Partial<Pick<GeoPromptSequence, "name" | "steps" | "enabled">>
  ) => {
    track(
      sequenceId,
      collection.update(sequenceId, (draft) => {
        Object.assign(draft, changes);
      }),
      "Failed to update conversation"
    );
  };

  const removeSequence = (sequenceId: string) => {
    track(
      sequenceId,
      collection.delete(sequenceId),
      "Failed to remove conversation"
    );
  };

  return {
    sequences,
    pendingSequenceIds: pendingIds,
    addSequence,
    updateSequence,
    removeSequence,
  };
}
