"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/utils/query-keys";
import {
  useDeleteReference,
  useReferences,
  useUpdateReference,
} from "../../../../../../lib/hooks/use-brand-references";
import { AddReferenceDialog } from "./add-reference-dialog";
import { ReferenceCard } from "./reference-card";

interface ReferencesListProps {
  organizationId: string;
  voiceId: string;
  dialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
}

export function ReferencesList({
  organizationId,
  voiceId,
  dialogOpen,
  onDialogOpenChange,
}: ReferencesListProps) {
  const { data } = useReferences(organizationId, voiceId);
  const deleteMutation = useDeleteReference(organizationId, voiceId);
  const updateMutation = useUpdateReference(organizationId, voiceId);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const handledCallback = useRef(false);
  const [initialStep, setInitialStep] = useState<"import-x" | undefined>();

  useEffect(() => {
    if (
      searchParams.get("twitterConnected") === "true" &&
      !handledCallback.current
    ) {
      handledCallback.current = true;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONNECTED_ACCOUNTS.list(organizationId),
      });
      toast.success("X account connected");
      setInitialStep("import-x");
      onDialogOpenChange(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, queryClient, organizationId, onDialogOpenChange]);

  const references = data?.references ?? [];

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Reference deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete reference"
      );
    }
  };

  const handleUpdateNote = async (id: string, note: string | null) => {
    try {
      await updateMutation.mutateAsync({ referenceId: id, data: { note } });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update note"
      );
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setInitialStep(undefined);
    }
    onDialogOpenChange(open);
  };

  return (
    <div className="space-y-4">
      {references.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-muted-foreground text-sm">
            No references yet. Add a tweet to help the AI match your writing
            style.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 space-y-4 sm:columns-2">
          {references.map((ref) => (
            <ReferenceCard
              isDeleting={deleteMutation.isPending}
              key={ref.id}
              onDelete={handleDelete}
              onUpdateNote={handleUpdateNote}
              reference={ref}
            />
          ))}
        </div>
      )}

      <AddReferenceDialog
        initialStep={initialStep}
        onOpenChange={handleDialogOpenChange}
        open={dialogOpen}
        organizationId={organizationId}
        voiceId={voiceId}
      />
    </div>
  );
}
