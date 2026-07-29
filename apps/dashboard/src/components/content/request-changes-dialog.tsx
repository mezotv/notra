"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import type { RequestChangesDialogProps } from "@/types/reviews";

export function RequestChangesDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: RequestChangesDialogProps) {
  const [comment, setComment] = useState("");

  return (
    <ResponsiveDialog
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return;
        }
        if (!nextOpen) {
          setComment("");
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <ResponsiveDialogContent className="sm:max-w-[30rem]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Request changes</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            The post goes back to draft so the author can revise it.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Field>
          <FieldLabel>Comment</FieldLabel>
          <Textarea
            className="max-h-[10rem] min-h-[6rem] overflow-y-auto"
            disabled={isPending}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What needs to change before this can be approved?"
            value={comment}
          />
          <p className="text-muted-foreground text-xs">
            Optional, but it helps the author know what to fix.
          </p>
        </Field>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={isPending}
            render={<Button variant="outline">Cancel</Button>}
          />
          <Button
            disabled={isPending}
            onClick={() => onConfirm(comment.trim())}
            variant="outline"
          >
            {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Request changes
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
