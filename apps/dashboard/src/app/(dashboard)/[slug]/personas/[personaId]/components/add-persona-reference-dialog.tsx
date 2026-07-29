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
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  PERSONA_REFERENCE_DEFAULT_APPLICABLE_TO,
  PERSONA_REFERENCE_TYPE_OPTIONS,
} from "@/constants/personas";
import { useCreatePersonaReference } from "@/lib/hooks/use-personas";
import type { ReferenceType } from "@/schemas/brand";
import { createPersonaReferenceSchema } from "@/schemas/personas";
import type { AddPersonaReferenceDialogProps } from "@/types/components/personas";

export function AddPersonaReferenceDialog({
  open,
  onOpenChange,
  organizationId,
  personaId,
}: AddPersonaReferenceDialogProps) {
  const createReference = useCreatePersonaReference(organizationId, personaId);
  const [type, setType] = useState<ReferenceType>("custom");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [note, setNote] = useState("");

  function resetForm() {
    setType("custom");
    setContent("");
    setSourceUrl("");
    setNote("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    const parsed = createPersonaReferenceSchema.safeParse({
      type,
      content,
      sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
      note: note.trim() ? note.trim() : null,
      applicableTo: PERSONA_REFERENCE_DEFAULT_APPLICABLE_TO[type],
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid reference");
      return;
    }

    try {
      await createReference.mutateAsync(parsed.data);
      toast.success("Reference added");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add reference"
      );
    }
  }

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogContent className="flex max-h-[85svh] flex-col overflow-hidden sm:max-w-[32rem]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add writing reference</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Paste something this person wrote so agents can learn their voice.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="-mx-4 min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="persona-reference-type">Type</FieldLabel>
            <Select
              disabled={createReference.isPending}
              onValueChange={(value) => {
                const option = PERSONA_REFERENCE_TYPE_OPTIONS.find(
                  (candidate) => candidate.value === value
                );
                if (option) {
                  setType(option.value);
                }
              }}
              value={type}
            >
              <SelectTrigger className="w-full" id="persona-reference-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {PERSONA_REFERENCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="persona-reference-content">
              Content<span className="-ml-1 text-destructive">*</span>
            </FieldLabel>
            <Textarea
              className="max-h-[14rem] min-h-[8rem]"
              disabled={createReference.isPending}
              id="persona-reference-content"
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the post or writing sample here."
              value={content}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="persona-reference-source">
              Source URL
            </FieldLabel>
            <Input
              disabled={createReference.isPending}
              id="persona-reference-source"
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://x.com/username/status/..."
              value={sourceUrl}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="persona-reference-note">Note</FieldLabel>
            <Textarea
              className="max-h-[6rem] min-h-[3.5rem]"
              disabled={createReference.isPending}
              id="persona-reference-note"
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this is a good example of their voice."
              value={note}
            />
          </Field>
        </div>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={createReference.isPending}
            render={<Button variant="outline">Cancel</Button>}
          />
          <Button
            disabled={createReference.isPending || !content.trim()}
            onClick={handleSubmit}
          >
            {createReference.isPending ? "Adding…" : "Add reference"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
