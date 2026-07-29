"use client";

import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useDeletePersona } from "@/lib/hooks/use-personas";
import type { DeletePersonaDialogProps } from "@/types/components/personas";

export function DeletePersonaCard({
  organizationId,
  persona,
  slug,
}: DeletePersonaDialogProps) {
  const router = useRouter();
  const deletePersona = useDeletePersona(organizationId);
  const [showDialog, setShowDialog] = useState(false);

  async function handleDelete() {
    try {
      await deletePersona.mutateAsync(persona.id);
      toast.success(`Persona "${persona.name}" deleted`);
      router.push(`/${slug}/personas`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete persona"
      );
    }
  }

  return (
    <TitleCard heading="Danger Zone">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Deleting a persona removes its profile, social accounts, and writing
          references. This cannot be undone.
        </p>
        <Button
          className="shrink-0"
          disabled={deletePersona.isPending}
          onClick={() => setShowDialog(true)}
          variant="destructive"
        >
          Delete Persona
        </Button>
      </div>

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!deletePersona.isPending) {
            setShowDialog(open);
          }
        }}
        open={showDialog}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete {persona.name}?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This permanently deletes the persona, its social accounts, and all
              of its writing references.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deletePersona.isPending}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePersona.isPending}
              onClick={handleDelete}
            >
              {deletePersona.isPending ? "Deleting..." : "Delete Persona"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </TitleCard>
  );
}
