"use client";

import {
  Delete02Icon,
  Link04Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { PERSONA_REFERENCE_TYPE_LABELS } from "@/constants/personas";
import {
  useDeletePersonaReference,
  usePersonaReferences,
  useUpdatePersonaReference,
} from "@/lib/hooks/use-personas";
import type {
  PersonaReferenceRowProps,
  PersonaReferencesCardProps,
} from "@/types/components/personas";
import { AddPersonaReferenceDialog } from "./add-persona-reference-dialog";

function ReferenceRow({
  reference,
  onDelete,
  onUpdateNote,
  isDeleting,
}: PersonaReferenceRowProps) {
  const [note, setNote] = useState(reference.note ?? "");

  function handleNoteBlur() {
    const trimmed = note.trim();
    if (trimmed === (reference.note ?? "")) {
      return;
    }
    onUpdateNote(reference.id, trimmed ? trimmed : null);
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {PERSONA_REFERENCE_TYPE_LABELS[reference.type] ?? reference.type}
          </Badge>
          {reference.applicableTo
            .filter((platform) => platform !== "all")
            .map((platform) => (
              <Badge key={platform} variant="outline">
                {platform}
              </Badge>
            ))}
        </div>
        <div className="flex items-center gap-1">
          {reference.sourceUrl ? (
            <a
              aria-label="Open source"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              href={reference.sourceUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <HugeiconsIcon className="size-4" icon={Link04Icon} />
            </a>
          ) : null}
          <Button
            aria-label="Delete reference"
            className="size-8 p-0 text-muted-foreground hover:text-destructive"
            disabled={isDeleting}
            onClick={() => onDelete(reference.id)}
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={Delete02Icon} />
          </Button>
        </div>
      </div>
      <p className="line-clamp-4 whitespace-pre-wrap text-sm">
        {reference.content}
      </p>
      <Input
        aria-label="Reference note"
        className="h-8 text-xs"
        onBlur={handleNoteBlur}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note about why this is a good example..."
        value={note}
      />
    </div>
  );
}

export function PersonaReferencesCard({
  organizationId,
  personaId,
}: PersonaReferencesCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isPending } = usePersonaReferences(organizationId, personaId);
  const deleteReference = useDeletePersonaReference(organizationId, personaId);
  const updateReference = useUpdatePersonaReference(organizationId, personaId);

  const references = data?.references ?? [];

  async function handleDelete(referenceId: string) {
    try {
      await deleteReference.mutateAsync(referenceId);
      toast.success("Reference deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete reference"
      );
    }
  }

  async function handleUpdateNote(referenceId: string, note: string | null) {
    try {
      await updateReference.mutateAsync({
        referenceId,
        payload: { note },
      });
      toast.success("Note saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save note"
      );
    }
  }

  return (
    <TitleCard heading="Writing References">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            Examples of how this person writes. Agents study these to match
            their voice.
          </p>
          <Button
            className="shrink-0 gap-1.5"
            onClick={() => setDialogOpen(true)}
            variant="outline"
          >
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add Reference
          </Button>
        </div>

        {isPending && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        )}
        {!isPending && references.length === 0 && (
          <p className="rounded-lg border border-dashed py-8 text-center text-muted-foreground text-sm">
            No references yet. Add a post or writing sample this person wrote.
          </p>
        )}
        {!isPending && references.length > 0 && (
          <div className="space-y-3">
            {references.map((reference) => (
              <ReferenceRow
                isDeleting={deleteReference.isPending}
                key={reference.id}
                onDelete={handleDelete}
                onUpdateNote={handleUpdateNote}
                reference={reference}
              />
            ))}
          </div>
        )}
      </div>

      <AddPersonaReferenceDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        organizationId={organizationId}
        personaId={personaId}
      />
    </TitleCard>
  );
}
